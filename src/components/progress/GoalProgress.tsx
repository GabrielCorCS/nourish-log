import { Target } from 'lucide-react'
import { useWeeklyEntries, useGoals, calculateDailyTotals } from '@/hooks'
import { getPastDays, toISODateString } from '@/lib/dates'
import type { FoodEntry } from '@/types/database'

type GoalStat = {
  label: string
  met: number
  total: number
  barGradient: string
  tileClass: string
  accentClass: string
}

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

  const stats: GoalStat[] = [
    {
      label: 'Calories',
      met: daysMetCalories,
      total: 7,
      barGradient: 'bg-gradient-to-r from-citrus to-terracotta',
      tileClass: 'bg-gradient-to-br from-citrus/[0.09] to-citrus/[0.03] ring-citrus/15',
      accentClass: 'text-citrus',
    },
    {
      label: 'Protein',
      met: daysMetProtein,
      total: 7,
      barGradient: 'bg-gradient-to-r from-[#34D27B] to-emerald',
      tileClass: 'bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] ring-emerald/20',
      accentClass: 'text-emerald-dark',
    },
    {
      label: 'Carbs',
      met: daysMetCarbs,
      total: 7,
      barGradient: 'bg-gradient-to-r from-[#F8CE5B] to-honey',
      tileClass: 'bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] ring-honey/30',
      accentClass: 'text-[#A9791B]',
    },
    {
      label: 'Fat',
      met: daysMetFat,
      total: 7,
      barGradient: 'bg-gradient-to-r from-[#F9A8D4] to-blush',
      tileClass: 'bg-gradient-to-br from-blush/[0.16] to-blush/[0.05] ring-blush/25',
      accentClass: 'text-[#C13C7E]',
    },
  ]

  return (
    <div className="rounded-[28px] bg-warm-white ring-1 ring-latte/60 p-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/12 text-emerald-dark">
          <Target className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">Weekly</p>
          <h2 className="font-display text-title font-semibold leading-none text-espresso">Goals hit</h2>
        </div>
      </div>

      <div className="space-y-3">
        {stats.map((stat) => {
          const pct = (stat.met / stat.total) * 100
          return (
            <div
              key={stat.label}
              className={`rounded-[22px] p-4 ring-1 ${stat.tileClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                  {stat.label}
                </span>
                <span className={`metric text-sm font-bold ${stat.accentClass}`}>
                  {stat.met}/{stat.total}
                  <span className="text-xs font-normal text-espresso/40 ml-1">days</span>
                </span>
              </div>

              {/* Progress rail */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/60">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-spring ${stat.barGradient}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Day dots */}
              <div className="mt-2 flex gap-1">
                {Array.from({ length: stat.total }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      i < stat.met ? stat.barGradient : 'bg-white/50'
                    }`}
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
