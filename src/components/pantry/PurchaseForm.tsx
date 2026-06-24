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
  NumberField,
  Select,
} from '@/components/ui'
import {
  useIngredients,
  useStores,
  useCreateGroceryPurchase,
  useFindOrCreateStore,
} from '@/hooks'
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
  const findOrCreateStore = useFindOrCreateStore()

  const [formData, setFormData] = useState({
    ingredient_id: ingredientId || '',
    quantity: 1,
    unit: 'g',
    price: 0,
    purchased_at: new Date().toISOString().split('T')[0],
    notes: '',
  })
  // Free-typed store name; resolved to a store id (find-or-create) on submit.
  const [storeName, setStoreName] = useState('')

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
      const store_id = await findOrCreateStore(storeName)
      await createPurchase.mutateAsync({
        ingredient_id: formData.ingredient_id || null,
        store_id,
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

            <div>
              <Input
                label="Store (optional)"
                list="purchase-store-options"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Type or pick a store"
              />
              <datalist id="purchase-store-options">
                {stores?.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Quantity"
                value={formData.quantity}
                onChange={(v) => setFormData({ ...formData, quantity: v })}
                error={errors.quantity}
                min={0}
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
              <NumberField
                label="Price ($)"
                value={formData.price}
                onChange={(v) => setFormData({ ...formData, price: v })}
                error={errors.price}
                min={0}
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
