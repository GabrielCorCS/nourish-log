import { useState } from 'react'
import { Store, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui'
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
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
          {stores?.length ?? 0} store{(stores?.length ?? 0) !== 1 ? 's' : ''}
        </p>
        <Button size="sm" onClick={() => setIsFormOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
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
        <div className="stagger grid gap-3 sm:grid-cols-2">
          {stores?.map((store) => (
            <div
              key={store.id}
              className="pressable flex items-center gap-3 rounded-[22px] bg-warm-white p-4 ring-1 ring-latte/60 transition-shadow hover:shadow-soft"
            >
              {/* Store avatar */}
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald/[0.10] to-emerald/[0.04] text-2xl ring-1 ring-emerald/15">
                {store.emoji || '🏪'}
              </div>

              <span className="flex-1 font-display font-semibold text-espresso">
                {store.name}
              </span>

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-espresso/40 hover:text-emerald-dark"
                  onClick={() => handleEdit(store)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-espresso/30 hover:text-terracotta hover:bg-terracotta/10"
                  onClick={() => handleDelete(store)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isFormOpen && (
        <StoreForm store={editingStore} onClose={handleCloseForm} />
      )}
    </div>
  )
}
