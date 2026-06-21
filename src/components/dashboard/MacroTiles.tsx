import { useTodayEntries, calculateDailyTotals, useGoals } from '@/hooks'
import { calculatePercentage } from '@/lib/utils'

type MacroKey = 'protein' | 'carbs' | 'fat'

const MACROS: {
  key: MacroKey
  label: string
  tile: string
  bar: string
  accent: string
}[] = [
  {
    key: 'protein',
    label: 'Protein',
    tile: 'bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] ring-emerald/20',
    bar: 'bg-gradient-to-r from-[#34D27B] to-emerald',
    accent: 'text-emerald-dark',
  },
  {
    key: 'carbs',
    label: 'Carbs',
    tile: 'bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] ring-honey/30',
    bar: 'bg-gradient-to-r from-[#F8CE5B] to-honey',
    accent: 'text-[#A9791B]',
  },
  {
    key: 'fat',
    label: 'Fat',
    tile: 'bg-gradient-to-br from-blush/[0.16] to-blush/[0.05] ring-blush/25',
    bar: 'bg-gradient-to-r from-[#F9A8D4] to-blush',
    accent: 'text-[#C13C7E]',
  },
]

function TileSkeleton() {
  return <div className="skeleton col-span-1 h-[120px] rounded-[22px]" />
}

/**
 * Three bright macro tiles for the bento grid. Self-contained — renders a
 * fragment of grid children so each sits in its own cell next to the hero.
 */
export function MacroTiles() {
  const { data: entries, isLoading: entriesLoading } = useTodayEntries()
  const { goals, isLoading: goalsLoading } = useGoals()

  if (entriesLoading || goalsLoading) {
    return (
      <>
        <TileSkeleton />
        <TileSkeleton />
        <TileSkeleton />
      </>
    )
  }

  const totals = calculateDailyTotals(entries || [])

  return (
    <>
      {MACROS.map((m) => {
        const value = Math.round(totals[m.key])
        const goal = Math.round(goals[m.key])
        const pct = calculatePercentage(totals[m.key], goals[m.key])
        return (
          <div
            key={m.key}
            className={`col-span-1 flex h-full min-h-[120px] flex-col justify-between rounded-[22px] p-4 ring-1 ${m.tile}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                {m.label}
              </span>
              <span className={`metric text-xs font-semibold ${m.accent}`}>
                {Math.round(pct)}%
              </span>
            </div>
            <div className="metric mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none text-espresso">{value}</span>
              <span className="text-sm font-medium text-espresso/45">/ {goal}g</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-spring ${m.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </>
  )
}
