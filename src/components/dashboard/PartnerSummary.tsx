import { Card } from '@/components/ui'
import { NutritionRings } from './NutritionRing'
import { useFoodEntriesByDate, calculateDailyTotals } from '@/hooks/useFoodEntries'
import { useGoalsFor } from '@/hooks/useUserSettings'
import { useHousehold } from '@/hooks/useHousehold'

// Shows the partner's progress for today, side-by-side with your own — the
// "see each other's stats" half of the shared-household experience.
export function PartnerSummary() {
  const { data: household } = useHousehold()
  const partner = household?.partner ?? null

  const { data: entries } = useFoodEntriesByDate(new Date(), partner?.id)
  const { goals } = useGoalsFor(partner?.id)

  if (!partner) return null

  const totals = calculateDailyTotals(entries ?? [])
  const mealCount = entries?.length ?? 0

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-full bg-latte flex items-center justify-center text-xl">
          {partner.avatar_emoji || '👤'}
        </div>
        <div className="min-w-0">
          <h2 className="font-heading text-lg font-bold text-espresso truncate">
            {partner.name}'s day
          </h2>
          <p className="text-sm text-espresso/50">
            {mealCount} {mealCount === 1 ? 'meal' : 'meals'} logged
          </p>
        </div>
      </div>

      <NutritionRings
        calories={{ current: totals.calories, goal: goals.calories }}
        protein={{ current: totals.protein, goal: goals.protein }}
        carbs={{ current: totals.carbs, goal: goals.carbs }}
        fat={{ current: totals.fat, goal: goals.fat }}
        size="sm"
      />
    </Card>
  )
}
