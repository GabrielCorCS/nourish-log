import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { LoadingState } from '@/components/shared'
import { useWeeklyEntries, calculateDailyTotals } from '@/hooks'
import { getPastDays } from '@/lib/dates'
import { getMacroPercentages } from '@/lib/nutrition'
import type { TooltipProps } from 'recharts'

// Palette hex values for recharts (can't use CSS vars inside SVG props)
const MACRO_COLORS = {
  Protein: { fill: '#16A34A', accent: 'text-emerald-dark', bg: 'bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] ring-emerald/20' },
  Carbs:   { fill: '#F2B53B', accent: 'text-[#A9791B]',    bg: 'bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] ring-honey/30' },
  Fat:     { fill: '#F472A6', accent: 'text-[#C13C7E]',    bg: 'bg-gradient-to-br from-blush/[0.16] to-blush/[0.05] ring-blush/25' },
}

type MacroKey = keyof typeof MACRO_COLORS

function ChartTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div className="rounded-[16px] bg-warm-white px-3.5 py-2.5 ring-1 ring-latte/60 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">{entry.name}</p>
      <p className="metric text-lg font-bold text-espresso">{entry.value}%</p>
    </div>
  )
}

export function MacroBreakdown() {
  const days = getPastDays(7)
  const { data: entries, isLoading } = useWeeklyEntries(days[0], days[6])

  if (isLoading) {
    return (
      <div className="rounded-[28px] bg-warm-white ring-1 ring-latte/60 p-5">
        <LoadingState message="Loading macro data..." />
      </div>
    )
  }

  const totals = calculateDailyTotals(entries || [])
  const percentages = getMacroPercentages(totals)

  const chartData: { name: MacroKey; value: number }[] = [
    { name: 'Protein', value: percentages.protein },
    { name: 'Carbs',   value: percentages.carbs },
    { name: 'Fat',     value: percentages.fat },
  ]

  return (
    <div className="rounded-[28px] bg-warm-white ring-1 ring-latte/60 p-5">
      {/* Header */}
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">This week</p>
        <h2 className="font-display text-title font-semibold text-espresso">Macro split</h2>
      </div>

      {/* Donut */}
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={44}
              outerRadius={72}
              paddingAngle={4}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={MACRO_COLORS[entry.name].fill}
                  opacity={0.9}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stat tiles row — mirrors the dashboard MacroTiles pattern */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(
          [
            { key: 'Protein' as const, gram: Math.round(totals.protein), pct: percentages.protein },
            { key: 'Carbs'   as const, gram: Math.round(totals.carbs),   pct: percentages.carbs   },
            { key: 'Fat'     as const, gram: Math.round(totals.fat),      pct: percentages.fat     },
          ] as const
        ).map(({ key, gram, pct }) => {
          const { bg, accent } = MACRO_COLORS[key]
          return (
            <div key={key} className={`rounded-[22px] p-3 ring-1 ${bg}`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-espresso/55">{key}</p>
              <p className={`metric mt-1 text-lg font-bold leading-none text-espresso`}>
                {gram}<span className="text-xs font-medium text-espresso/40">g</span>
              </p>
              <p className={`metric text-xs font-semibold mt-0.5 ${accent}`}>{pct}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
