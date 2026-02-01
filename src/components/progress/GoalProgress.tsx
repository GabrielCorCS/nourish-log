import { Target } from 'lucide-react'
import { Card, Progress } from '@/components/ui'
import { useWeeklyEntries, useGoals, calculateDailyTotals } from '@/hooks'
import { getPastDays, toISODateString } from '@/lib/dates'
import type { FoodEntry } from '@/types/database'

export function GoalProgress() {
  const days = getPastDays(7)
  const { data: entries } = useWeeklyEntries(days[0], days[6])
  const { goals } = useGoals()

  // Group entries by date and count days where goals were met
  const entriesByDate = (entries || []).reduce(
    (acc, entry) => {
      const date = toISODateString(new Date(entry.logged_at))
      if (!acc[date]) acc[date] = []
      acc[date].push(entry)
      return acc
    },
    {} as Record<string, FoodEntry[]>
  )

  let daysMetCalories = 0
  let daysMetProtein = 0
  let daysMetCarbs = 0
  let daysMetFat = 0

  days.forEach((date) => {
    const dateStr = toISODateString(date)
    const dayEntries = entriesByDate[dateStr] || []
    if (dayEntries.length === 0) return

    const totals = calculateDailyTotals(dayEntries)

    // Consider goal met if within 10% above or below
    if (totals.calories >= goals.calories * 0.9 && totals.calories <= goals.calories * 1.1) {
      daysMetCalories++
    }
    if (totals.protein >= goals.protein * 0.9) {
      daysMetProtein++
    }
    if (totals.carbs >= goals.carbs * 0.9 && totals.carbs <= goals.carbs * 1.1) {
      daysMetCarbs++
    }
    if (totals.fat >= goals.fat * 0.9 && totals.fat <= goals.fat * 1.1) {
      daysMetFat++
    }
  })

  const stats = [
    {
      label: 'Calorie Goal',
      met: daysMetCalories,
      total: 7,
      color: 'calories' as const,
    },
    {
      label: 'Protein Goal',
      met: daysMetProtein,
      total: 7,
      color: 'protein' as const,
    },
    {
      label: 'Carbs Goal',
      met: daysMetCarbs,
      total: 7,
      color: 'carbs' as const,
    },
    {
      label: 'Fat Goal',
      met: daysMetFat,
      total: 7,
      color: 'fat' as const,
    },
  ]

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-center gap-2 mb-6">
        <Target className="h-5 w-5 text-caramel" />
        <h3 className="font-heading text-lg font-semibold text-espresso">
          Weekly Goal Progress
        </h3>
      </div>

      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-espresso">{stat.label}</span>
              <span className="text-sm font-medium text-espresso">
                {stat.met}/{stat.total} days
              </span>
            </div>
            <Progress
              value={stat.met}
              max={stat.total}
              color={stat.color}
              size="md"
            />
          </div>
        ))}
      </div>
    </Card>
  )
}
