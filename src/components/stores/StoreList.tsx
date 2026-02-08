import { useState } from 'react'
import { Store, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { EmptyState, ListSkeleton } from '@/components/shared'
import { StoreForm } from './StoreForm'
import { useStores, useDeleteStore, type Store as StoreType } from '@/hooks/useStores'
import { useUIStore } from '@/stores'

export function StoreList() {
  const addToast = useUIStore((state) => state.addToast)
  const { data: stores, isLoading } = useStores()
  const deleteStore = useDeleteStore()

  const [editingStore, setEditingStore] = useState<StoreType | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const handleEdit = (store: StoreType) => {
    setEditingStore(store)
    setIsFormOpen(true)
  }

  const handleDelete = async (store: StoreType) => {
    if (confirm(`Delete "${store.name}"?`)) {
      try {
        await deleteStore.mutateAsync(store.id)
        addToast('Store deleted', 'success')
      } catch {
        addToast('Failed to delete store', 'error')
      }
    }
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingStore(null)
  }

  if (isLoading) {
    return <ListSkeleton count={4} />
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-espresso">Your Stores</h3>
        <Button size="sm" onClick={() => setIsFormOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Store
        </Button>
      </div>

      {stores?.length === 0 ? (
        <EmptyState
          icon={<Store className="h-8 w-8" />}
          title="No stores yet"
          description="Add stores where you shop to track spending"
          action={{ label: 'Add Store', onClick: () => setIsFormOpen(true) }}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {stores?.map((store) => (
            <Card key={store.id} variant="elevated" padding="md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{store.emoji || '🏪'}</span>
                <span className="flex-1 font-medium text-espresso">
                  {store.name}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(store)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-terracotta"
                    onClick={() => handleDelete(store)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isFormOpen && (
        <StoreForm store={editingStore} onClose={handleCloseForm} />
      )}
    </div>
  )
}
