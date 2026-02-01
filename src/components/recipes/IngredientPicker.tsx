import { useState } from 'react'
import { Plus, Minus, Search, X } from 'lucide-react'
import { Input, Button, Card } from '@/components/ui'
import { MacroPills } from '@/components/shared'
import { useIngredients } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Ingredient } from '@/types/database'

interface SelectedIngredient {
  ingredient: Ingredient
  quantity: number
}

interface IngredientPickerProps {
  selectedIngredients: SelectedIngredient[]
  onAdd: (ingredient: Ingredient, quantity: number) => void
  onRemove: (ingredientId: string) => void
  onUpdateQuantity: (ingredientId: string, quantity: number) => void
}

export function IngredientPicker({
  selectedIngredients,
  onAdd,
  onRemove,
  onUpdateQuantity,
}: IngredientPickerProps) {
  const [search, setSearch] = useState('')
  const { data: ingredients } = useIngredients()

  const filteredIngredients = ingredients?.filter(
    (ingredient) =>
      ingredient.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedIngredients.find((si) => si.ingredient.id === ingredient.id)
  )

  const handleAdd = (ingredient: Ingredient) => {
    onAdd(ingredient, 1)
    setSearch('')
  }

  return (
    <div className="space-y-4">
      {/* Search and Add */}
      <div className="relative">
        <Input
          placeholder="Search ingredients to add..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
        />

        {search && filteredIngredients && filteredIngredients.length > 0 && (
          <Card
            variant="elevated"
            padding="none"
            className="absolute top-full left-0 right-0 mt-1 z-10 max-h-48 overflow-y-auto"
          >
            {filteredIngredients.slice(0, 10).map((ingredient) => (
              <button
                key={ingredient.id}
                type="button"
                onClick={() => handleAdd(ingredient)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-latte/20 transition-colors text-left"
              >
                <span>{ingredient.emoji || '🍽️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-espresso truncate">
                    {ingredient.name}
                  </p>
                  <p className="text-xs text-espresso/50">
                    {ingredient.calories} cal · {ingredient.serving_size}{' '}
                    {ingredient.serving_unit}
                  </p>
                </div>
                <Plus className="h-4 w-4 text-caramel flex-shrink-0" />
              </button>
            ))}
          </Card>
        )}
      </div>

      {/* Selected Ingredients */}
      {selectedIngredients.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-espresso">
            Selected ({selectedIngredients.length})
          </p>
          {selectedIngredients.map(({ ingredient, quantity }) => (
            <div
              key={ingredient.id}
              className="flex items-center gap-3 p-3 bg-cream rounded-input"
            >
              <span className="text-lg">{ingredient.emoji || '🍽️'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-espresso truncate">
                  {ingredient.name}
                </p>
                <p className="text-xs text-espresso/50">
                  {ingredient.serving_size} {ingredient.serving_unit} per
                  serving
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() =>
                    onUpdateQuantity(ingredient.id, Math.max(0.5, quantity - 0.5))
                  }
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-8 text-center text-sm font-medium">
                  {quantity}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onUpdateQuantity(ingredient.id, quantity + 0.5)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-terracotta"
                  onClick={() => onRemove(ingredient.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
