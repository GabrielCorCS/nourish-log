import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { useWeeklyEntries, calculateDailyTotals } from '@/hooks'
import { getPastDays } from '@/lib/dates'
import { getMacroPercentages } from '@/lib/nutrition'

export function MacroBreakdown() {
  const days = getPastDays(7)
  const { data: entries, isLoading } = useWeeklyEntries(days[0], days[6])

  if (isLoading) {
    return (
      <Card variant="elevated" padding="lg">
        <LoadingState message="Loading macro data..." />
      </Card>
    )
  }

  const totals = calculateDailyTotals(entries || [])
  const percentages = getMacroPercentages(totals)

  const chartData = [
    { name: 'Protein', value: percentages.protein, color: '#A8B5A0' },
    { name: 'Carbs', value: percentages.carbs, color: '#E8D4A8' },
    { name: 'Fat', value: percentages.fat, color: '#E8C4C4' },
  ]

  return (
    <Card variant="elevated" padding="lg">
      <h3 className="font-heading text-lg font-semibold text-espresso mb-4">
        Macro Breakdown (This Week)
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => (
                <span className="text-sm text-espresso">
                  {value} ({entry.payload?.value}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 pt-4 border-t border-latte">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xl font-bold text-sage">{Math.round(totals.protein)}g</p>
            <p className="text-xs text-espresso/50">Protein</p>
          </div>
          <div>
            <p className="text-xl font-bold text-honey">{Math.round(totals.carbs)}g</p>
            <p className="text-xs text-espresso/50">Carbs</p>
          </div>
          <div>
            <p className="text-xl font-bold text-blush">{Math.round(totals.fat)}g</p>
            <p className="text-xs text-espresso/50">Fat</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
