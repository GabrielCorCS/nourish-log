import { useLogMealStore } from '@/stores'
import { MEAL_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function MealTypeSelector() {
  const setMealType = useLogMealStore((state) => state.setMealType)

  return (
    <div className="grid grid-cols-2 gap-3">
      {MEAL_TYPES.map((meal) => (
        <button
          key={meal.value}
          type="button"
          onClick={() => setMealType(meal.value)}
          className={cn(
            'pressable group flex flex-col items-center justify-center gap-1.5 rounded-[22px] p-5',
            'bg-gradient-to-br from-emerald/[0.09] to-emerald/[0.03]',
            'ring-1 ring-emerald/15',
            'transition-all duration-200',
            'hover:ring-emerald/40 hover:from-emerald/[0.14] hover:to-emerald/[0.06]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald'
          )}
        >
          <span className="text-3xl transition-transform duration-200 group-hover:scale-110">
            {meal.emoji}
          </span>
          <span className="font-display text-base font-semibold text-espresso">{meal.label}</span>
          <span className="metric text-xs text-espresso/45">{meal.timeRange}</span>
        </button>
      ))}
    </div>
  )
}
