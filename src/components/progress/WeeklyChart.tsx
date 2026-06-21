import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { LoadingState } from '@/components/shared'
import { useWeeklyEntries, useGoals, calculateDailyTotals } from '@/hooks'
import { getPastDays, formatDate, toISODateString } from '@/lib/dates'
import type { FoodEntry } from '@/types/database'
import type { TooltipProps } from 'recharts'

// Custom tooltip matching the bento design language
function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value ?? 0
  // goal lives in the raw data row so we can reference it without a second Bar
  const goalCals = (payload[0]?.payload as { goal?: number })?.goal
  return (
    <div className="rounded-[16px] bg-warm-white px-3.5 py-2.5 ring-1 ring-latte/60 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-espresso/55 mb-1">{label}</p>
      <p className="metric text-lg font-bold text-espresso">
        {val} <span className="text-xs font-medium text-espresso/45">kcal</span>
      </p>
      {goalCals != null && goalCals > 0 && (
        <p className="metric text-xs text-espresso/50 mt-0.5">goal {goalCals}</p>
      )}
    </div>
  )
}

export function WeeklyChart() {
  const days = getPastDays(7)
  const { data: entries, isLoading } = useWeeklyEntries(days[0], days[6])
  const { goals } = useGoals()

  if (isLoading) {
    return (
      <div className="rounded-[28px] bg-warm-white ring-1 ring-latte/60 p-5">
        <LoadingState message="Loading chart data..." />
      </div>
    )
  }

  // Group entries by date
  const entriesByDate = (entries || []).reduce(
    (acc, entry) => {
      const date = toISODateString(new Date(entry.logged_at))
      if (!acc[date]) acc[date] = []
      acc[date].push(entry)
      return acc
    },
    {} as Record<string, FoodEntry[]>
  )

  // Create chart data
  const chartData = days.map((date) => {
    const dateStr = toISODateString(date)
    const dayEntries = entriesByDate[dateStr] || []
    const totals = calculateDailyTotals(dayEntries)

    return {
      date: formatDate(date, 'EEE'),
      calories: Math.round(totals.calories),
      goal: goals.calories,
    }
  })

  const today = formatDate(new Date(), 'EEE')

  return (
    <div className="rounded-[28px] bg-warm-white ring-1 ring-latte/60 p-5">
      {/* Header */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">This week</p>
        <h2 className="font-display text-title font-semibold text-espresso">Calories</h2>
      </div>

      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            {/* Subtle green-tinted grid lines */}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#D6E8D8"
              strokeOpacity={0.8}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#14331F', fillOpacity: 0.45, fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#14331F', fillOpacity: 0.45, fontSize: 11 }}
              width={40}
            />
            {/* Goal reference line */}
            <ReferenceLine
              y={goals.calories}
              stroke="#D6E8D8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: '#14331F', fillOpacity: 0.04 }}
            />
            <Bar
              dataKey="calories"
              radius={[6, 6, 0, 0]}
              maxBarSize={36}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.date}
                  fill={entry.date === today ? '#0F7A38' : '#16A34A'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 text-xs font-medium text-espresso/55">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald" />
          Calories
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm border-2 border-dashed border-latte" />
          Goal: <span className="metric">{goals.calories}</span>
        </span>
      </div>
    </div>
  )
}
