import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Button,
  Input,
} from '@/components/ui'
import { EmojiPicker } from '@/components/shared'
import { useCreateStore, useUpdateStore, type Store } from '@/hooks/useStores'
import { useUIStore } from '@/stores'
import { STORE_KINDS, type StoreKind } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface StoreFormProps {
  store?: Store | null
  onClose: () => void
}

export function StoreForm({ store, onClose }: StoreFormProps) {
  const addToast = useUIStore((state) => state.addToast)
  const createStore = useCreateStore()
  const updateStore = useUpdateStore()

  const [formData, setFormData] = useState({
    name: '',
    emoji: '🏪',
    kind: 'grocery' as StoreKind,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        emoji: store.emoji || '🏪',
        kind: store.kind ?? 'grocery',
      })
    }
  }, [store])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Store name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      if (store) {
        await updateStore.mutateAsync({
          id: store.id,
          ...formData,
        })
        addToast('Store updated successfully', 'success')
      } else {
        await createStore.mutateAsync(formData)
        addToast('Store added successfully', 'success')
      }
      onClose()
    } catch {
      addToast('Failed to save store', 'error')
    }
  }

  const isLoading = createStore.isPending || updateStore.isPending

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{store ? 'Edit Store' : 'Add Store'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <div className="flex gap-4">
              <EmojiPicker
                value={formData.emoji}
                onChange={(emoji) => setFormData({ ...formData, emoji })}
              />
              <div className="flex-1">
                <Input
                  label="Store Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={errors.name}
                  placeholder="e.g., Costco, Target"
                />
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-espresso">Type</p>
              <div className="grid grid-cols-2 gap-2">
                {STORE_KINDS.map((k) => (
                  <button
                    key={k.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, kind: k.value })}
                    className={cn(
                      'pressable flex items-center justify-center gap-2 rounded-[12px] border py-2.5 text-sm font-semibold transition-colors',
                      formData.kind === k.value
                        ? 'border-emerald/30 bg-emerald/10 text-emerald-dark ring-1 ring-emerald/20'
                        : 'border-latte text-espresso/60 hover:bg-cream'
                    )}
                  >
                    <span className="text-base">{k.emoji}</span>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {store ? 'Update' : 'Add'} Store
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
