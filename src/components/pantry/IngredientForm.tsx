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
import { EmojiPicker } from '@/components/shared'
import {
  useCreateIngredient,
  useUpdateIngredient,
  useStores,
  useFindOrCreateStore,
} from '@/hooks'
import { useUIStore } from '@/stores'
import { INGREDIENT_CATEGORIES, SERVING_UNITS } from '@/lib/constants'
import type { Ingredient, IngredientCategory } from '@/types/database'

interface IngredientFormProps {
  ingredient?: Ingredient | null
  onClose: () => void
}

export function IngredientForm({ ingredient, onClose }: IngredientFormProps) {
  const addToast = useUIStore((state) => state.addToast)
  const createIngredient = useCreateIngredient()
  const updateIngredient = useUpdateIngredient()
  const { data: stores } = useStores()
  const findOrCreateStore = useFindOrCreateStore()

  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    category: 'proteins' as IngredientCategory,
    brand: '',
    serving_size: 100,
    serving_unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  })
  // Free-typed store name; resolved to a store id (find-or-create) on submit.
  const [storeName, setStoreName] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        emoji: ingredient.emoji || '',
        category: ingredient.category,
        brand: ingredient.brand || '',
        serving_size: ingredient.serving_size,
        serving_unit: ingredient.serving_unit,
        calories: ingredient.calories,
        protein: ingredient.protein,
        carbs: ingredient.carbs,
        fat: ingredient.fat,
      })
    }
  }, [ingredient])

  // Resolve the saved store's display name once the stores list is available.
  useEffect(() => {
    if (ingredient?.default_store_id) {
      const match = stores?.find((s) => s.id === ingredient.default_store_id)
      if (match) setStoreName(match.name)
    }
  }, [ingredient, stores])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (formData.serving_size <= 0) {
      newErrors.serving_size = 'Serving size must be positive'
    }
    if (formData.calories < 0) {
      newErrors.calories = 'Calories cannot be negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      const default_store_id = await findOrCreateStore(storeName)
      const submitData = {
        ...formData,
        brand: formData.brand.trim() || null,
        default_store_id,
      }

      if (ingredient) {
        await updateIngredient.mutateAsync({
          id: ingredient.id,
          ...submitData,
        })
        addToast('Ingredient updated successfully', 'success')
      } else {
        await createIngredient.mutateAsync(submitData)
        addToast('Ingredient created successfully', 'success')
      }
      onClose()
    } catch {
      addToast('Failed to save ingredient', 'error')
    }
  }

  const isLoading = createIngredient.isPending || updateIngredient.isPending

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {ingredient ? 'Edit Ingredient' : 'Add Ingredient'}
          </DialogTitle>
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
                  label="Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  error={errors.name}
                  placeholder="e.g., Chicken Breast"
                />
              </div>
            </div>

            <Input
              label="Brand (optional)"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              placeholder="e.g., Kirkland, Trader Joe's"
            />

            <Select
              label="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as IngredientCategory,
                })
              }
              options={INGREDIENT_CATEGORIES.map((c) => ({
                value: c.value,
                label: `${c.emoji} ${c.label}`,
              }))}
            />

            <div>
              <Input
                label="Default store (optional)"
                list="ingredient-store-options"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Type or pick a store"
              />
              <datalist id="ingredient-store-options">
                {stores?.map((s) => (
                  <option key={s.id} value={s.name} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                label="Serving Size"
                value={formData.serving_size}
                onChange={(v) =>
                  setFormData({ ...formData, serving_size: v })
                }
                error={errors.serving_size}
                min={0}
              />
              <Select
                label="Unit"
                value={formData.serving_unit}
                onChange={(e) =>
                  setFormData({ ...formData, serving_unit: e.target.value })
                }
                options={SERVING_UNITS.map((u) => ({ value: u, label: u }))}
              />
            </div>

            <div className="rounded-[18px] bg-cream/70 p-4 ring-1 ring-latte/50">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Nutrition per serving
              </p>
              <div className="grid grid-cols-2 gap-4">
                <NumberField
                  label="Calories"
                  value={formData.calories}
                  onChange={(v) => setFormData({ ...formData, calories: v })}
                  error={errors.calories}
                  min={0}
                />
                <NumberField
                  label="Protein (g)"
                  value={formData.protein}
                  onChange={(v) => setFormData({ ...formData, protein: v })}
                  min={0}
                />
                <NumberField
                  label="Carbs (g)"
                  value={formData.carbs}
                  onChange={(v) => setFormData({ ...formData, carbs: v })}
                  min={0}
                />
                <NumberField
                  label="Fat (g)"
                  value={formData.fat}
                  onChange={(v) => setFormData({ ...formData, fat: v })}
                  min={0}
                />
              </div>
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {ingredient ? 'Update' : 'Add'} Ingredient
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
