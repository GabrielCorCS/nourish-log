import { Flame, Trophy, Calendar } from 'lucide-react'
import { Card } from '@/components/ui'
import { useUserStreak } from '@/hooks'
import { formatDate } from '@/lib/dates'
import { pluralize } from '@/lib/utils'

export function StreakDisplay() {
  const { data: streak } = useUserStreak()

  const currentStreak = streak?.current_streak || 0
  const longestStreak = streak?.longest_streak || 0
  const lastLogged = streak?.last_logged_date

  return (
    <Card variant="elevated" padding="lg">
      <h3 className="font-heading text-lg font-semibold text-espresso mb-6">
        Your Streaks
      </h3>

      <div className="grid grid-cols-2 gap-6">
        {/* Current Streak */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto flex items-center justify-center bg-terracotta/10 rounded-full mb-3">
            <Flame className="h-8 w-8 text-terracotta" />
          </div>
          <p className="text-3xl font-bold text-espresso">{currentStreak}</p>
          <p className="text-sm text-espresso/50">
            {pluralize(currentStreak, 'day')} streak
          </p>
        </div>

        {/* Longest Streak */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto flex items-center justify-center bg-caramel/10 rounded-full mb-3">
            <Trophy className="h-8 w-8 text-caramel" />
          </div>
          <p className="text-3xl font-bold text-espresso">{longestStreak}</p>
          <p className="text-sm text-espresso/50">longest streak</p>
        </div>
      </div>

      {lastLogged && (
        <div className="mt-6 pt-4 border-t border-latte flex items-center justify-center gap-2 text-sm text-espresso/50">
          <Calendar className="h-4 w-4" />
          <span>Last logged: {formatDate(lastLogged)}</span>
        </div>
      )}
    </Card>
  )
}
