import { Flame } from 'lucide-react'
import { useGoals } from '@/hooks'
import { calculatePercentage, cn } from '@/lib/utils'

interface DailySummaryProps {
  calories: number
  protein: number
  carbs: number
  fat: number
  mealCount: number
}

const MACROS = [
  {
    key: 'protein' as const,
    label: 'Protein',
    unit: 'g',
    tile: 'bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] ring-emerald/20',
    bar: 'bg-gradient-to-r from-[#34D27B] to-emerald',
    accent: 'text-emerald-dark',
  },
  {
    key: 'carbs' as const,
    label: 'Carbs',
    unit: 'g',
    tile: 'bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] ring-honey/30',
    bar: 'bg-gradient-to-r from-[#F8CE5B] to-honey',
    accent: 'text-[#A9791B]',
  },
  {
    key: 'fat' as const,
    label: 'Fat',
    unit: 'g',
    tile: 'bg-gradient-to-br from-blush/[0.16] to-blush/[0.05] ring-blush/25',
    bar: 'bg-gradient-to-r from-[#F9A8D4] to-blush',
    accent: 'text-[#C13C7E]',
  },
]

export function DailySummary({
  calories,
  protein,
  carbs,
  fat,
  mealCount,
}: DailySummaryProps) {
  const { goals } = useGoals()

  const consumed = Math.round(calories)
  const goal = Math.round(goals.calories)
  const remaining = goal - consumed
  const isOver = remaining < 0
  const pct = calculatePercentage(calories, goals.calories)

  const macroValues: Record<string, number> = { protein, carbs, fat }
  const macroGoals: Record<string, number> = {
    protein: goals.protein,
    carbs: goals.carbs,
    fat: goals.fat,
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Dark hero tile — calorie focal point */}
      <div className="relative col-span-2 flex min-h-[180px] flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-6 text-white lg:col-span-2">
        {/* Ambient glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-14 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.45), transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-8 h-44 w-44 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.4), transparent 70%)' }}
        />

        {/* Top row */}
        <div className="relative flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-lime/90">
            Daily total
          </span>
          <span className="metric flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
            <Flame className="h-3.5 w-3.5 text-citrus" />
            {mealCount} {mealCount === 1 ? 'meal' : 'meals'}
          </span>
        </div>

        {/* Big number */}
        <div className="relative mt-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-[3.75rem] font-semibold leading-[0.85] tracking-tight text-white sm:text-[4.5rem]">
              {Math.abs(remaining)}
            </span>
            <span className="metric mb-1.5 text-base font-medium text-white/70">kcal</span>
          </div>
          <p className="mt-1.5 text-sm font-medium text-white/60">
            {isOver ? 'over your goal' : 'remaining today'}
            {' · '}
            {consumed} of {goal} logged
          </p>
        </div>

        {/* Progress rail */}
        <div className="relative mt-4">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-700 ease-spring',
                isOver
                  ? 'bg-gradient-to-r from-citrus to-terracotta'
                  : 'bg-gradient-to-r from-lime to-emerald'
              )}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <div className="metric mt-1.5 flex justify-between text-[11px] text-white/45">
            <span>{consumed} eaten</span>
            <span>goal {goal}</span>
          </div>
        </div>
      </div>

      {/* Three macro tiles */}
      {MACROS.map((m) => {
        const value = Math.round(macroValues[m.key])
        const macroGoal = Math.round(macroGoals[m.key])
        const macroPct = calculatePercentage(macroValues[m.key], macroGoals[m.key])

        return (
          <div
            key={m.key}
            className={`col-span-1 flex min-h-[100px] flex-col justify-between rounded-[22px] p-4 ring-1 ${m.tile}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                {m.label}
              </span>
              <span className={`metric text-xs font-semibold ${m.accent}`}>
                {Math.round(macroPct)}%
              </span>
            </div>
            <div className="metric mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-bold leading-none text-espresso">{value}</span>
              <span className="text-xs font-medium text-espresso/45">/ {macroGoal}g</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/60">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-spring ${m.bar}`}
                style={{ width: `${Math.min(macroPct, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
