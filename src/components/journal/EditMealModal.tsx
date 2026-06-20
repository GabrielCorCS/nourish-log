import { useState, useEffect } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { MEAL_TYPES } from '@/lib/constants'
import { useUpdateFoodEntry } from '@/hooks'
import { useUIStore } from '@/stores'
import type { FoodEntryWithDetails, MealType } from '@/types/database'

interface EditMealModalProps {
  entry: FoodEntryWithDetails | null
  onClose: () => void
}

export function EditMealModal({ entry, onClose }: EditMealModalProps) {
  const updateEntry = useUpdateFoodEntry()
  const addToast = useUIStore((s) => s.addToast)

  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [servings, setServings] = useState(1)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (entry) {
      setMealType(entry.meal_type)
      setServings(entry.servings || 1)
      setNotes(entry.notes ?? '')
    }
  }, [entry])

  if (!entry) return null

  // Macros per single serving, to rescale from when servings change.
  const baseServings = entry.servings || 1
  const base = entry.recipe
    ? {
        calories: entry.recipe.total_calories / entry.recipe.servings,
        protein: entry.recipe.total_protein / entry.recipe.servings,
        carbs: entry.recipe.total_carbs / entry.recipe.servings,
        fat: entry.recipe.total_fat / entry.recipe.servings,
      }
    : {
        calories: entry.calories / baseServings,
        protein: entry.protein / baseServings,
        carbs: entry.carbs / baseServings,
        fat: entry.fat / baseServings,
      }

  const scaled = {
    calories: base.calories * servings,
    protein: base.protein * servings,
    carbs: base.carbs * servings,
    fat: base.fat * servings,
  }

  const handleSave = async () => {
    try {
      await updateEntry.mutateAsync({
        id: entry.id,
        meal_type: mealType,
        servings,
        calories: scaled.calories,
        protein: scaled.protein,
        carbs: scaled.carbs,
        fat: scaled.fat,
        notes: notes || null,
      })
      addToast('Meal updated', 'success')
      onClose()
    } catch {
      addToast('Failed to update meal', 'error')
    }
  }

  return (
    <Dialog open={!!entry} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Edit meal</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-espresso/70 mb-2">Meal</p>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => setMealType(mt.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-input border py-2 text-xs transition-colors',
                      mealType === mt.value
                        ? 'border-caramel bg-caramel/10 text-caramel'
                        : 'border-latte text-espresso/60 hover:bg-latte/30'
                    )}
                  >
                    <span className="text-lg">{mt.emoji}</span>
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-espresso/70 mb-2">Servings</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 100) / 100))
                  }
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{servings}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setServings((s) => Math.round((s + 0.5) * 100) / 100)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />

            <div className="rounded-input bg-cream p-3 text-sm text-espresso/70">
              {Math.round(scaled.calories)} cal · {Math.round(scaled.protein)}p ·{' '}
              {Math.round(scaled.carbs)}c · {Math.round(scaled.fat)}f
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            onClick={handleSave}
            isLoading={updateEntry.isPending}
            leftIcon={<Check className="h-4 w-4" />}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
