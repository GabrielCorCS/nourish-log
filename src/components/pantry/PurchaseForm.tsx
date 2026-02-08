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
  Select,
} from '@/components/ui'
import { useIngredients, useStores, useCreateGroceryPurchase } from '@/hooks'
import { useUIStore } from '@/stores'
import { SERVING_UNITS } from '@/lib/constants'

interface PurchaseFormProps {
  ingredientId?: string | null
  onClose: () => void
}

export function PurchaseForm({ ingredientId, onClose }: PurchaseFormProps) {
  const addToast = useUIStore((state) => state.addToast)
  const { data: ingredients } = useIngredients()
  const { data: stores } = useStores()
  const createPurchase = useCreateGroceryPurchase()

  const [formData, setFormData] = useState({
    ingredient_id: ingredientId || '',
    store_id: '',
    quantity: 1,
    unit: 'g',
    price: 0,
    purchased_at: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (ingredientId) {
      setFormData((prev) => ({ ...prev, ingredient_id: ingredientId }))
    }
  }, [ingredientId])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.ingredient_id) {
      newErrors.ingredient_id = 'Please select an ingredient'
    }
    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }
    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be positive'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      await createPurchase.mutateAsync({
        ingredient_id: formData.ingredient_id || null,
        store_id: formData.store_id || null,
        quantity: formData.quantity,
        unit: formData.unit,
        price: formData.price,
        purchased_at: new Date(formData.purchased_at).toISOString(),
        notes: formData.notes || null,
      })
      addToast('Purchase logged successfully', 'success')
      onClose()
    } catch {
      addToast('Failed to log purchase', 'error')
    }
  }

  const isLoading = createPurchase.isPending

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Log Purchase</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-4">
            <Select
              label="Ingredient"
              value={formData.ingredient_id}
              onChange={(e) =>
                setFormData({ ...formData, ingredient_id: e.target.value })
              }
              error={errors.ingredient_id}
              placeholder="Select ingredient..."
              options={
                ingredients?.map((i) => ({
                  value: i.id,
                  label: `${i.emoji || '🍽️'} ${i.name}`,
                })) || []
              }
            />

            <Select
              label="Store"
              value={formData.store_id}
              onChange={(e) =>
                setFormData({ ...formData, store_id: e.target.value })
              }
              placeholder="Select store (optional)..."
              options={
                stores?.map((s) => ({
                  value: s.id,
                  label: `${s.emoji || '🏪'} ${s.name}`,
                })) || []
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: Number(e.target.value),
                  })
                }
                error={errors.quantity}
                min={0}
                step={0.1}
              />
              <Select
                label="Unit"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
                options={SERVING_UNITS.map((u) => ({ value: u, label: u }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Price ($)"
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: Number(e.target.value),
                  })
                }
                error={errors.price}
                min={0}
                step={0.01}
              />
              <Input
                label="Purchase Date"
                type="date"
                value={formData.purchased_at}
                onChange={(e) =>
                  setFormData({ ...formData, purchased_at: e.target.value })
                }
              />
            </div>

            <Input
              label="Notes (optional)"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="e.g., On sale this week"
            />
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Log Purchase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
