import { Flame, Trophy, Calendar } from 'lucide-react'
import { useUserStreak } from '@/hooks'
import { formatDate } from '@/lib/dates'
import { pluralize } from '@/lib/utils'

export function StreakDisplay() {
  const { data: streak } = useUserStreak()

  const currentStreak = streak?.current_streak || 0
  const longestStreak = streak?.longest_streak || 0
  const lastLogged = streak?.last_logged_date

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-5 text-white">
      {/* Ambient glows — mirror the TodaySummary hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-14 h-40 w-40 rounded-full opacity-55 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.45), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full opacity-35 blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.4), transparent 70%)' }}
      />

      {/* Label */}
      <div className="relative mb-5 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-lime/90">Streaks</p>
        <Flame className="h-4 w-4 text-citrus" />
      </div>

      {/* Two stat tiles */}
      <div className="relative grid grid-cols-2 gap-3">
        {/* Current streak */}
        <div className="rounded-[22px] bg-white/10 p-4 ring-1 ring-white/10">
          <p className="text-xs font-bold uppercase tracking-wide text-white/55 mb-2">Current</p>
          <div className="metric flex items-baseline gap-1">
            <span className="font-display text-4xl font-semibold leading-none text-white">{currentStreak}</span>
          </div>
          <p className="metric mt-1 text-sm font-medium text-white/65">
            {pluralize(currentStreak, 'day')}
          </p>
        </div>

        {/* Longest streak */}
        <div className="rounded-[22px] bg-white/10 p-4 ring-1 ring-white/10">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-white/55">Best</p>
            <Trophy className="h-3.5 w-3.5 text-honey" />
          </div>
          <div className="metric flex items-baseline gap-1">
            <span className="font-display text-4xl font-semibold leading-none text-white">{longestStreak}</span>
          </div>
          <p className="metric mt-1 text-sm font-medium text-white/65">
            {pluralize(longestStreak, 'day')}
          </p>
        </div>
      </div>

      {/* Last logged */}
      {lastLogged && (
        <div className="relative mt-4 flex items-center gap-2 text-xs font-medium text-white/45">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>Last logged: {formatDate(lastLogged)}</span>
        </div>
      )}
    </div>
  )
}
