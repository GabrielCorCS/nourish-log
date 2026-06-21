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

  // Macros per single serving, to rescale when servings change.
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
          {/* Item preview */}
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] text-2xl ring-1 ring-emerald/15">
              {entry.recipe?.emoji || '🍽️'}
            </span>
            <div className="min-w-0 flex-1">
              <DialogTitle className="truncate">
                {entry.recipe?.name || 'Quick add'}
              </DialogTitle>
              <p className="metric mt-0.5 text-xs text-espresso/45">
                {Math.round(scaled.calories)} kcal · {servings} {servings === 1 ? 'serving' : 'servings'}
              </p>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="space-y-5">
            {/* Meal type selector */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Meal type
              </p>
              <div className="grid grid-cols-4 gap-2">
                {MEAL_TYPES.map((mt) => (
                  <button
                    key={mt.value}
                    type="button"
                    onClick={() => setMealType(mt.value)}
                    className={cn(
                      'pressable flex flex-col items-center gap-1 rounded-[14px] border py-2.5 text-xs font-semibold transition-colors',
                      mealType === mt.value
                        ? 'border-emerald/30 bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] text-emerald-dark ring-1 ring-emerald/20'
                        : 'border-latte text-espresso/55 hover:border-emerald/20 hover:bg-latte/30'
                    )}
                  >
                    <span className="text-xl">{mt.emoji}</span>
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Servings stepper */}
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Servings
              </p>
              <div className="flex items-center gap-3 rounded-[14px] bg-cream p-3 ring-1 ring-latte/60">
                <button
                  type="button"
                  onClick={() =>
                    setServings((s) => Math.max(0.5, Math.round((s - 0.5) * 100) / 100))
                  }
                  className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 hover:bg-latte/30"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="metric flex-1 text-center text-xl font-bold text-espresso">
                  {servings}
                </span>
                <button
                  type="button"
                  onClick={() => setServings((s) => Math.round((s + 0.5) * 100) / 100)}
                  className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 hover:bg-latte/30"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Notes */}
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />

            {/* Live macro preview */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Cal', value: Math.round(scaled.calories), color: 'text-terracotta', bg: 'from-terracotta/[0.10] to-terracotta/[0.04] ring-terracotta/15' },
                { label: 'Protein', value: `${Math.round(scaled.protein)}g`, color: 'text-emerald-dark', bg: 'from-emerald/[0.12] to-emerald/[0.04] ring-emerald/20' },
                { label: 'Carbs', value: `${Math.round(scaled.carbs)}g`, color: 'text-[#A9791B]', bg: 'from-honey/[0.18] to-honey/[0.06] ring-honey/30' },
                { label: 'Fat', value: `${Math.round(scaled.fat)}g`, color: 'text-[#C13C7E]', bg: 'from-blush/[0.16] to-blush/[0.05] ring-blush/25' },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex flex-col items-center gap-0.5 rounded-[14px] bg-gradient-to-br p-3 ring-1 ${item.bg}`}
                >
                  <span className={`metric text-lg font-bold leading-none ${item.color}`}>
                    {item.value}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-espresso/40">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button
            onClick={handleSave}
            isLoading={updateEntry.isPending}
            leftIcon={<Check className="h-4 w-4" />}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
