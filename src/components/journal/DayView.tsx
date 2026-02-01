import { BookOpen } from 'lucide-react'
import { EmptyState, LoadingState } from '@/components/shared'
import { MealCard } from './MealCard'
import { DailySummary } from './DailySummary'
import { useFoodEntriesByDate, useDeleteFoodEntry, calculateDailyTotals } from '@/hooks'
import { useUIStore } from '@/stores'
import { MEAL_TYPES } from '@/lib/constants'
import type { FoodEntryWithDetails, MealType } from '@/types/database'

interface DayViewProps {
  date: Date
}

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

export function DayView({ date }: DayViewProps) {
  const { data: entries, isLoading } = useFoodEntriesByDate(date)
  const deleteEntry = useDeleteFoodEntry()
  const { addToast, openLogMealModal } = useUIStore()

  const handleDelete = async (entry: FoodEntryWithDetails) => {
    if (confirm('Delete this meal entry?')) {
      try {
        await deleteEntry.mutateAsync(entry.id)
        addToast('Entry deleted', 'success')
      } catch {
        addToast('Failed to delete entry', 'error')
      }
    }
  }

  if (isLoading) {
    return <LoadingState message="Loading entries..." />
  }

  if (!entries || entries.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-8 w-8" />}
        title="No meals logged"
        description="Log your first meal for this day"
        action={{ label: 'Log Meal', onClick: openLogMealModal }}
      />
    )
  }

  const grouped = groupEntriesByMealType(entries)
  const totals = calculateDailyTotals(entries)

  return (
    <div className="space-y-6">
      <DailySummary
        calories={totals.calories}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
        mealCount={entries.length}
      />

      <div className="space-y-6">
        {MEAL_TYPES.map((mealType) => {
          const mealEntries = grouped[mealType.value]
          if (!mealEntries || mealEntries.length === 0) return null

          return (
            <div key={mealType.value}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{mealType.emoji}</span>
                <h3 className="font-heading font-semibold text-espresso">
                  {mealType.label}
                </h3>
                <span className="text-xs text-espresso/50">
                  ({mealEntries.length})
                </span>
              </div>
              <div className="space-y-2">
                {mealEntries.map((entry) => (
                  <MealCard
                    key={entry.id}
                    entry={entry}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
