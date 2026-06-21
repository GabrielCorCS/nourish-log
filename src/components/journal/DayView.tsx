import { useState } from 'react'
import { BookOpen } from 'lucide-react'
import { EmptyState, LoadingState } from '@/components/shared'
import { MealCard } from './MealCard'
import { EditMealModal } from './EditMealModal'
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
  const [editEntry, setEditEntry] = useState<FoodEntryWithDetails | null>(null)

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
    return (
      <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
        <LoadingState message="Loading entries..." />
      </div>
    )
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="No meals logged"
          description="Log your first meal for this day"
          action={{ label: 'Log meal', onClick: openLogMealModal }}
        />
      </div>
    )
  }

  const grouped = groupEntriesByMealType(entries)
  const totals = calculateDailyTotals(entries)

  return (
    <div className="space-y-6">
      {/* Hero bento summary */}
      <DailySummary
        calories={totals.calories}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
        mealCount={entries.length}
      />

      {/* Meal-type sections — stagger cascade */}
      <div className="stagger space-y-5">
        {MEAL_TYPES.map((mealType) => {
          const mealEntries = grouped[mealType.value]
          if (!mealEntries || mealEntries.length === 0) return null

          return (
            <div key={mealType.value} className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
              {/* Section header */}
              <div className="mb-3 flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] text-lg ring-1 ring-emerald/15">
                  {mealType.emoji}
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-lg font-semibold leading-none text-espresso">
                    {mealType.label}
                  </h3>
                </div>
                <span className="metric rounded-full bg-cream px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-espresso/45 ring-1 ring-latte/60">
                  {mealEntries.length}
                </span>
              </div>

              {/* Meal cards */}
              <div className="space-y-2.5">
                {mealEntries.map((entry) => (
                  <MealCard
                    key={entry.id}
                    entry={entry}
                    onEdit={setEditEntry}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <EditMealModal entry={editEntry} onClose={() => setEditEntry(null)} />
    </div>
  )
}
