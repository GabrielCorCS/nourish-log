import { Flame } from 'lucide-react'
import { useTodayEntries, calculateDailyTotals, useGoals } from '@/hooks'
import { calculatePercentage, cn } from '@/lib/utils'

function HeroSkeleton() {
  return (
    <div className="h-full min-h-[260px] rounded-[28px] bg-espresso/90 p-7">
      <div className="skeleton h-4 w-24 rounded-full opacity-30" />
      <div className="skeleton mt-8 h-20 w-48 rounded-2xl opacity-30" />
      <div className="skeleton mt-10 h-3 w-full rounded-full opacity-30" />
    </div>
  )
}

/**
 * The dashboard's dramatic focal point: a dark "today" tile with an oversized
 * calorie figure. Calories are the number people actually act on, so they get
 * the whole hero; macros live in their own bright tiles alongside.
 */
export function TodaySummary() {
  const { data: entries, isLoading: entriesLoading } = useTodayEntries()
  const { goals, isLoading: goalsLoading } = useGoals()

  if (entriesLoading || goalsLoading) return <HeroSkeleton />

  const totals = calculateDailyTotals(entries || [])
  const consumed = Math.round(totals.calories)
  const goal = Math.round(goals.calories)
  const remaining = goal - consumed
  const isOver = remaining < 0
  const pct = calculatePercentage(totals.calories, goals.calories)
  const mealCount = entries?.length || 0

  return (
    <div className="relative flex h-full min-h-[260px] flex-col justify-between overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-7 text-white">
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.45), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-10 h-52 w-52 rounded-full opacity-40 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.4), transparent 70%)' }}
      />

      {/* Top row */}
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-lime/90">
          Today
        </span>
        <span className="metric flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
          <Flame className="h-3.5 w-3.5 text-citrus" />
          {consumed} kcal in
        </span>
      </div>

      {/* Giant focal number */}
      <div className="relative mt-4">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-[4.5rem] font-semibold leading-[0.85] tracking-tight text-white sm:text-[5.5rem]">
            {Math.abs(remaining)}
          </span>
          <span className="metric mb-2 text-lg font-medium text-white/70">kcal</span>
        </div>
        <p className="mt-2 text-sm font-medium text-white/65">
          {isOver ? 'over your goal today' : 'left to eat today'}
          {' · '}
          {mealCount === 0 ? 'nothing logged yet' : `${mealCount} ${mealCount === 1 ? 'meal' : 'meals'}`}
        </p>
      </div>

      {/* Progress rail */}
      <div className="relative mt-6">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-700 ease-spring',
              isOver
                ? 'bg-gradient-to-r from-citrus to-terracotta'
                : 'bg-gradient-to-r from-lime to-emerald'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="metric mt-2 flex justify-between text-xs text-white/55">
          <span>{consumed}</span>
          <span>goal {goal}</span>
        </div>
      </div>
    </div>
  )
}
