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
import { EmojiPicker } from '@/components/shared'
import { useCreateIngredient, useUpdateIngredient, useStores } from '@/hooks'
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

  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    category: 'proteins' as IngredientCategory,
    serving_size: 100,
    serving_unit: 'g',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    default_store_id: '' as string,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (ingredient) {
      setFormData({
        name: ingredient.name,
        emoji: ingredient.emoji || '',
        category: ingredient.category,
        serving_size: ingredient.serving_size,
        serving_unit: ingredient.serving_unit,
        calories: ingredient.calories,
        protein: ingredient.protein,
        carbs: ingredient.carbs,
        fat: ingredient.fat,
        default_store_id: ingredient.default_store_id || '',
      })
    }
  }, [ingredient])

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
      const submitData = {
        ...formData,
        default_store_id: formData.default_store_id || null,
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

            <Select
              label="Default Store (optional)"
              value={formData.default_store_id}
              onChange={(e) =>
                setFormData({ ...formData, default_store_id: e.target.value })
              }
              placeholder="Select a store..."
              options={
                stores?.map((s) => ({
                  value: s.id,
                  label: `${s.emoji || '🏪'} ${s.name}`,
                })) || []
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Serving Size"
                type="number"
                value={formData.serving_size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    serving_size: Number(e.target.value),
                  })
                }
                error={errors.serving_size}
                min={0}
                step={0.1}
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

            <div className="border-t border-latte pt-4">
              <p className="text-sm font-medium text-espresso mb-3">
                Nutrition per serving
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Calories"
                  type="number"
                  value={formData.calories}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      calories: Number(e.target.value),
                    })
                  }
                  error={errors.calories}
                  min={0}
                />
                <Input
                  label="Protein (g)"
                  type="number"
                  value={formData.protein}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      protein: Number(e.target.value),
                    })
                  }
                  min={0}
                  step={0.1}
                />
                <Input
                  label="Carbs (g)"
                  type="number"
                  value={formData.carbs}
                  onChange={(e) =>
                    setFormData({ ...formData, carbs: Number(e.target.value) })
                  }
                  min={0}
                  step={0.1}
                />
                <Input
                  label="Fat (g)"
                  type="number"
                  value={formData.fat}
                  onChange={(e) =>
                    setFormData({ ...formData, fat: Number(e.target.value) })
                  }
                  min={0}
                  step={0.1}
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
