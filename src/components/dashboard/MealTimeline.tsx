import { Clock } from 'lucide-react'
import { Card } from '@/components/ui'
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
      <Card variant="elevated" padding="lg">
        <LoadingState message="Loading meals..." />
      </Card>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <Card variant="elevated" padding="lg">
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No meals logged yet"
          description="Start tracking your meals to see your timeline"
        />
      </Card>
    )
  }

  const grouped = groupEntriesByMealType(entries)

  return (
    <Card variant="elevated" padding="md">
      <h3 className="font-heading text-lg font-semibold text-espresso mb-4">
        Today's Meals
      </h3>
      <div className="space-y-4">
        {MEAL_TYPES.map((mealType) => {
          const mealEntries = grouped[mealType.value]
          if (!mealEntries || mealEntries.length === 0) return null

          return (
            <div key={mealType.value}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{mealType.emoji}</span>
                <span className="font-medium text-espresso">{mealType.label}</span>
              </div>
              <div className="space-y-2 pl-7">
                {mealEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="bg-cream rounded-input p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-espresso truncate">
                          {entry.recipe?.emoji} {entry.recipe?.name || 'Quick add'}
                        </p>
                        <p className="text-xs text-espresso/50 mt-0.5">
                          {formatTime(entry.logged_at)}
                          {entry.servings !== 1 &&
                            ` · ${entry.servings} servings`}
                        </p>
                      </div>
                    </div>
                    <MacroPills
                      calories={entry.calories}
                      protein={entry.protein}
                      carbs={entry.carbs}
                      fat={entry.fat}
                      className="mt-2"
                    />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
