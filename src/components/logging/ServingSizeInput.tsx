import { Minus, Plus } from 'lucide-react'
import { Textarea } from '@/components/ui'
import { MacroDisplay } from '@/components/shared'
import { useLogMealStore } from '@/stores'

export function ServingSizeInput() {
  const {
    servings,
    setServings,
    notes,
    setNotes,
    selectedRecipe,
    source,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  } = useLogMealStore()

  const showServingsControl = source === 'recipe' && selectedRecipe

  return (
    <div className="space-y-5">
      {/* Servings stepper */}
      {showServingsControl && (
        <div className="rounded-[22px] bg-gradient-to-br from-emerald/[0.09] to-emerald/[0.03] p-4 ring-1 ring-emerald/15">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-espresso/55">
            Number of servings
          </p>
          <div className="flex items-center justify-center gap-5">
            <button
              type="button"
              onClick={() => setServings(Math.max(0.5, servings - 0.5))}
              className="pressable grid h-10 w-10 place-items-center rounded-2xl bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 transition-colors hover:ring-emerald/40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="metric min-w-[4rem] text-center text-4xl font-bold text-espresso">
              {servings}
            </span>
            <button
              type="button"
              onClick={() => setServings(servings + 0.5)}
              className="pressable grid h-10 w-10 place-items-center rounded-2xl bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60 transition-colors hover:ring-emerald/40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Nutrition strip */}
      <div className="rounded-[22px] bg-cream p-4 ring-1 ring-latte/40">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-espresso/55 text-center">
          Nutrition{showServingsControl && ` · ${servings} serving${servings !== 1 ? 's' : ''}`}
        </p>
        <MacroDisplay
          calories={totalCalories}
          protein={totalProtein}
          carbs={totalCarbs}
          fat={totalFat}
          layout="grid"
          size="lg"
        />
      </div>

      {/* Notes */}
      <Textarea
        label="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add any notes about this meal…"
        rows={2}
      />
    </div>
  )
}
