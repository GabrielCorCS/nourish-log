import { useLogMealStore } from '@/stores'
import { MEAL_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { MealType } from '@/types/database'

export function MealTypeSelector() {
  const setMealType = useLogMealStore((state) => state.setMealType)

  return (
    <div className="grid grid-cols-2 gap-3">
      {MEAL_TYPES.map((meal) => (
        <button
          key={meal.value}
          onClick={() => setMealType(meal.value)}
          className={cn(
            'flex flex-col items-center justify-center p-6 rounded-card',
            'bg-cream border-2 border-transparent',
            'hover:border-caramel hover:bg-caramel/5',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-caramel focus:ring-offset-2'
          )}
        >
          <span className="text-3xl mb-2">{meal.emoji}</span>
          <span className="font-medium text-espresso">{meal.label}</span>
          <span className="text-xs text-espresso/50">{meal.timeRange}</span>
        </button>
      ))}
    </div>
  )
}
