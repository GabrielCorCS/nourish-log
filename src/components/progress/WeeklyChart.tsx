import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { useWeeklyEntries, useGoals, calculateDailyTotals } from '@/hooks'
import { getPastDays, formatDate, toISODateString } from '@/lib/dates'
import type { FoodEntry } from '@/types/database'

export function WeeklyChart() {
  const days = getPastDays(7)
  const { data: entries, isLoading } = useWeeklyEntries(days[0], days[6])
  const { goals } = useGoals()

  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg">
        <LoadingState message="Loading chart data..." />
      </Card>
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

  return (
    <Card variant="elevated" padding="lg">
      <h3 className="font-heading text-lg font-semibold text-espresso mb-4">
        Weekly Calories
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D4C4B0" vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B5D4D', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6B5D4D', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#FFFEF9',
                border: '1px solid #D4C4B0',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#3D3024' }}
            />
            <Bar
              dataKey="calories"
              fill="#C8846C"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-terracotta" />
          <span className="text-espresso/60">Calories consumed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-dashed border-latte" />
          <span className="text-espresso/60">Goal: {goals.calories}</span>
        </div>
      </div>
    </Card>
  )
}
