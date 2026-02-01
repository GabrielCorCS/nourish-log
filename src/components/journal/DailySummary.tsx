import { Card } from '@/components/ui'
import { NutritionRings } from '@/components/dashboard'
import { useGoals } from '@/hooks'

interface DailySummaryProps {
  calories: number
  protein: number
  carbs: number
  fat: number
  mealCount: number
}

export function DailySummary({
  calories,
  protein,
  carbs,
  fat,
  mealCount,
}: DailySummaryProps) {
  const { goals } = useGoals()

  return (
    <Card variant="elevated" padding="md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-espresso">
          Daily Summary
        </h3>
        <span className="text-sm text-espresso/50">
          {mealCount} meal{mealCount !== 1 ? 's' : ''}
        </span>
      </div>
      <NutritionRings
        calories={{ current: calories, goal: goals.calories }}
        protein={{ current: protein, goal: goals.protein }}
        carbs={{ current: carbs, goal: goals.carbs }}
        fat={{ current: fat, goal: goals.fat }}
        size="sm"
      />
    </Card>
  )
}
