import { MacroDisplay } from '@/components/shared'
import { useLogMealStore } from '@/stores'
import { useGoals } from '@/hooks'
import { MEAL_TYPES } from '@/lib/constants'

export function NutritionPreview() {
  const {
    mealType,
    selectedRecipe,
    selectedIngredients,
    source,
    servings,
    notes,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
  } = useLogMealStore()

  const { goals } = useGoals()

  const mealInfo = MEAL_TYPES.find((m) => m.value === mealType)

  const calPct   = Math.round((totalCalories / goals.calories) * 100)
  const protPct  = Math.round((totalProtein  / goals.protein)  * 100)
  const carbsPct = Math.round((totalCarbs    / goals.carbs)    * 100)
  const fatPct   = Math.round((totalFat      / goals.fat)      * 100)

  return (
    <div className="space-y-4">
      {/* Meal identity card */}
      <div className="flex items-start gap-3 rounded-[22px] bg-warm-white p-4 ring-1 ring-latte/60">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream text-2xl shadow-soft ring-1 ring-latte/40">
          {source === 'recipe' ? selectedRecipe?.emoji || '🍽️' : '🥗'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-espresso">
            {source === 'recipe'
              ? selectedRecipe?.name
              : `${selectedIngredients.length} ingredient${selectedIngredients.length !== 1 ? 's' : ''}`}
          </p>
          <p className="metric text-sm text-espresso/50">
            {mealInfo?.emoji} {mealInfo?.label}
            {source === 'recipe' && ` · ${servings} serving${servings !== 1 ? 's' : ''}`}
          </p>
          {notes && (
            <p className="mt-1.5 text-sm italic text-espresso/55">&ldquo;{notes}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Nutrition totals */}
      <div className="rounded-[22px] bg-cream p-4 ring-1 ring-latte/40">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-wide text-espresso/55">
          This meal provides
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

      {/* % of daily goals — color-blocked stat strip echoing MacroTiles */}
      <div className="grid grid-cols-4 gap-2">
        {/* Calories */}
        <div className="flex flex-col items-center justify-between rounded-[22px] bg-gradient-to-br from-terracotta/[0.14] to-terracotta/[0.05] p-3 ring-1 ring-terracotta/20">
          <span className="metric text-2xl font-bold text-terracotta">{calPct}%</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-espresso/50">
            Cal
          </span>
        </div>
        {/* Protein */}
        <div className="flex flex-col items-center justify-between rounded-[22px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] p-3 ring-1 ring-emerald/20">
          <span className="metric text-2xl font-bold text-emerald-dark">{protPct}%</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-espresso/50">
            Pro
          </span>
        </div>
        {/* Carbs */}
        <div className="flex flex-col items-center justify-between rounded-[22px] bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] p-3 ring-1 ring-honey/25">
          <span className="metric text-2xl font-bold text-[#A9791B]">{carbsPct}%</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-espresso/50">
            Carb
          </span>
        </div>
        {/* Fat */}
        <div className="flex flex-col items-center justify-between rounded-[22px] bg-gradient-to-br from-blush/[0.15] to-blush/[0.05] p-3 ring-1 ring-blush/20">
          <span className="metric text-2xl font-bold text-[#C13C7E]">{fatPct}%</span>
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-espresso/50">
            Fat
          </span>
        </div>
      </div>
    </div>
  )
}
