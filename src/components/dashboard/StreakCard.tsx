import { Flame } from 'lucide-react'
import { useUserStreak } from '@/hooks'
import { pluralize } from '@/lib/utils'

export function StreakCard() {
  const { data: streak } = useUserStreak()

  const currentStreak = streak?.current_streak || 0
  const longestStreak = streak?.longest_streak || 0

  return (
    <div className="relative col-span-1 flex h-full min-h-[120px] flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-br from-citrus to-terracotta p-4 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl"
      />
      <div className="relative flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-white/85">Streak</span>
        <Flame className="h-4 w-4 text-white/90" />
      </div>
      <div className="metric relative mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold leading-none">{currentStreak}</span>
        <span className="text-sm font-medium text-white/80">{pluralize(currentStreak, 'day')}</span>
      </div>
      <p className="metric relative mt-2 text-xs font-medium text-white/75">
        Best: {longestStreak} {pluralize(longestStreak, 'day')}
      </p>
    </div>
  )
}
