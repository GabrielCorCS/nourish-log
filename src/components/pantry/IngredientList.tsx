import { useState } from 'react'
import { Apple, Search } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { EmptyState, ListSkeleton } from '@/components/shared'
import { IngredientCard } from './IngredientCard'
import { IngredientForm } from './IngredientForm'
import { useIngredients, useDeleteIngredient } from '@/hooks'
import { useFilterStore, useUIStore } from '@/stores'
import type { Ingredient } from '@/types/database'

export function IngredientList() {
  const { pantrySearch, pantryCategory, setPantrySearch } = useFilterStore()
  const addToast = useUIStore((state) => state.addToast)

  const { data: ingredients, isLoading } = useIngredients(pantryCategory)
  const deleteIngredient = useDeleteIngredient()

  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const filteredIngredients = ingredients?.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(pantrySearch.toLowerCase())
  )

  const handleEdit = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setIsFormOpen(true)
  }

  const handleDelete = async (ingredient: Ingredient) => {
    if (confirm(`Delete "${ingredient.name}"?`)) {
      try {
        await deleteIngredient.mutateAsync(ingredient.id)
        addToast('Ingredient deleted', 'success')
      } catch {
        addToast('Failed to delete ingredient', 'error')
      }
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingIngredient(null)
  }

  if (isLoading) {
    return <ListSkeleton count={6} />
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search ingredients..."
            value={pantrySearch}
            onChange={(e) => setPantrySearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button onClick={() => setIsFormOpen(true)}>Add</Button>
      </div>

      {filteredIngredients?.length === 0 ? (
        <EmptyState
          icon={<Apple className="h-8 w-8" />}
          title="No ingredients found"
          description={
            pantrySearch
              ? 'Try a different search term'
              : 'Add your first ingredient to get started'
          }
          action={
            !pantrySearch
              ? { label: 'Add Ingredient', onClick: () => setIsFormOpen(true) }
              : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredIngredients?.map((ingredient) => (
            <IngredientCard
              key={ingredient.id}
              ingredient={ingredient}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {isFormOpen && (
        <IngredientForm
          ingredient={editingIngredient}
          onClose={handleCloseForm}
        />
      )}
    </div>
  )
}
