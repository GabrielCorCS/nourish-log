import { Clock } from 'lucide-react'
import { MacroPills, EmptyState, LoadingState } from '@/components/shared'
import { useTodayEntries } from '@/hooks'
import { MEAL_TYPES } from '@/lib/constants'
import { formatTime } from '@/lib/dates'
import type { FoodEntryWithDetails, MealType } from '@/types/database'

function groupEntriesByMealType(entries: FoodEntryWithDetails[]) {
  return entries.reduce(
    (acc, entry) => {
      if (!acc[entry.meal_type]) {
        acc[entry.meal_type] = []
      }
      acc[entry.meal_type].push(entry)
      return acc
    },
    {} as Record<MealType, FoodEntryWithDetails[]>
  )
}

export function MealTimeline() {
  const { data: entries, isLoading } = useTodayEntries()

  if (isLoading) {
    return (
      <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
        <LoadingState message="Loading meals..." />
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No meals logged yet"
          description="Start tracking your meals to see your timeline"
        />
      </div>
    )
  }

  const grouped = groupEntriesByMealType(entries)

  return (
    <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
      <h3 className="mb-4 font-display text-xl font-semibold text-espresso">
        Today&rsquo;s meals
      </h3>
      <div className="space-y-5">
        {MEAL_TYPES.map((mealType) => {
          const mealEntries = grouped[mealType.value]
          if (!mealEntries || mealEntries.length === 0) return null

          return (
            <div key={mealType.value}>
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-base">{mealType.emoji}</span>
                <span className="text-sm font-semibold uppercase tracking-wide text-espresso/60">
                  {mealType.label}
                </span>
                <span className="metric rounded-full bg-cream px-2 py-0.5 text-[11px] font-semibold text-espresso/50">
                  {mealEntries.length}
                </span>
                <span className="ml-auto h-px flex-1 bg-latte/70" />
              </div>
              <div className="space-y-2">
                {mealEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-card border border-latte bg-cream/60 p-3 transition-colors hover:bg-cream"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warm-white text-xl shadow-soft">
                        {entry.recipe?.emoji || '🍽️'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-espresso">
                          {entry.recipe?.name || 'Quick add'}
                        </p>
                        <p className="metric mt-0.5 text-xs text-espresso/45">
                          {formatTime(entry.logged_at)}
                          {entry.servings !== 1 && ` · ${entry.servings} servings`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="metric text-base font-bold text-espresso">
                          {Math.round(entry.calories)}
                        </span>
                        <span className="block text-[10px] font-medium uppercase text-espresso/40">
                          kcal
                        </span>
                      </div>
                    </div>
                    <MacroPills
                      calories={entry.calories}
                      protein={entry.protein}
                      carbs={entry.carbs}
                      fat={entry.fat}
                      className="mt-2.5"
                      hideCalories
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
