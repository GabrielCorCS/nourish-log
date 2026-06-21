import { MacroPills } from '@/components/shared'
import { useFoodEntriesByDate, calculateDailyTotals } from '@/hooks/useFoodEntries'
import { useGoalsFor } from '@/hooks/useUserSettings'
import { useHousehold } from '@/hooks/useHousehold'
import { calculatePercentage } from '@/lib/utils'

// The "see each other's stats" half of the shared-household experience.
export function PartnerSummary() {
  const { data: household } = useHousehold()
  const partner = household?.partner ?? null

  const { data: entries } = useFoodEntriesByDate(new Date(), partner?.id)
  const { goals } = useGoalsFor(partner?.id)

  if (!partner) return null

  const totals = calculateDailyTotals(entries ?? [])
  const mealCount = entries?.length ?? 0
  const pct = calculatePercentage(totals.calories, goals.calories)

  return (
    <div className="col-span-2 flex h-full flex-col justify-between rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sage/25 to-emerald/10 text-xl ring-1 ring-emerald/15">
          {partner.avatar_emoji || '👤'}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-display text-lg font-semibold text-espresso">
            {partner.name}&rsquo;s day
          </h2>
          <p className="text-xs text-espresso/50">
            {mealCount} {mealCount === 1 ? 'meal' : 'meals'} logged
          </p>
        </div>
        <div className="metric shrink-0 text-right">
          <span className="text-xl font-bold text-espresso">{Math.round(totals.calories)}</span>
          <span className="block text-[10px] font-medium uppercase tracking-wide text-espresso/40">
            / {Math.round(goals.calories)} kcal
          </span>
        </div>
      </div>

      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-latte/50">
        <div
          className="h-full rounded-full bg-gradient-to-r from-citrus to-terracotta transition-[width] duration-700 ease-spring"
          style={{ width: `${pct}%` }}
        />
      </div>

      <MacroPills
        calories={totals.calories}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
        hideCalories
        className="mt-3.5"
      />
    </div>
  )
}
