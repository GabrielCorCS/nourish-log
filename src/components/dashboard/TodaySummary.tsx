import { Card } from '@/components/ui'
import { NutritionRings } from './NutritionRing'
import { useTodayEntries, calculateDailyTotals, useGoals } from '@/hooks'
import { formatDate } from '@/lib/dates'
import { LoadingState } from '@/components/shared'

export function TodaySummary() {
  const { data: entries, isLoading: entriesLoading } = useTodayEntries()
  const { goals, isLoading: goalsLoading } = useGoals()

  if (entriesLoading || goalsLoading) {
    return (
      <Card variant="elevated" padding="lg">
        <LoadingState message="Loading today's progress..." />
      </Card>
    )
  }

  const totals = calculateDailyTotals(entries || [])
  const today = new Date()

  return (
    <Card variant="elevated" padding="lg">
      <div className="text-center mb-6">
        <h2 className="font-heading text-xl font-bold text-espresso">
          Today's Progress
        </h2>
        <p className="text-sm text-espresso/50 mt-1">
          {formatDate(today, 'EEEE, MMMM d')}
        </p>
      </div>

      <NutritionRings
        calories={{ current: totals.calories, goal: goals.calories }}
        protein={{ current: totals.protein, goal: goals.protein }}
        carbs={{ current: totals.carbs, goal: goals.carbs }}
        fat={{ current: totals.fat, goal: goals.fat }}
        size="md"
      />

      <div className="mt-6 pt-4 border-t border-latte">
        <div className="flex justify-between text-sm">
          <span className="text-espresso/60">Meals logged</span>
          <span className="font-medium text-espresso">
            {entries?.length || 0}
          </span>
        </div>
      </div>
    </Card>
  )
}
