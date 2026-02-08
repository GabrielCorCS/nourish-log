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
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name,
        emoji: store.emoji || '🏪',
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
                  placeholder="e.g., Costco, Trader Joe's"
                />
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
