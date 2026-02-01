import { Flame, Trophy } from 'lucide-react'
import { Card } from '@/components/ui'
import { useUserStreak } from '@/hooks'
import { pluralize } from '@/lib/utils'

export function StreakCard() {
  const { data: streak } = useUserStreak()

  const currentStreak = streak?.current_streak || 0
  const longestStreak = streak?.longest_streak || 0

  return (
    <Card variant="elevated" padding="md">
      <h3 className="font-heading text-lg font-semibold text-espresso mb-4">
        Your Streak
      </h3>
      <div className="flex items-center justify-around">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-terracotta/10 rounded-full mb-2">
            <Flame className="h-6 w-6 text-terracotta" />
          </div>
          <span className="text-2xl font-bold text-espresso">{currentStreak}</span>
          <span className="text-xs text-espresso/50">
            {pluralize(currentStreak, 'day')} streak
          </span>
        </div>
        <div className="w-px h-16 bg-latte" />
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-caramel/10 rounded-full mb-2">
            <Trophy className="h-6 w-6 text-caramel" />
          </div>
          <span className="text-2xl font-bold text-espresso">{longestStreak}</span>
          <span className="text-xs text-espresso/50">longest streak</span>
        </div>
      </div>
    </Card>
  )
}
