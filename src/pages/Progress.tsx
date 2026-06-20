import { PageContainer } from '@/components/layout'
import {
  WeeklyChart,
  MacroBreakdown,
  StreakDisplay,
  GoalProgress,
} from '@/components/progress'
import { WeightTracker } from '@/components/progress/WeightTracker'

export function Progress() {
  return (
    <PageContainer
      title="Progress"
      description="Your nutrition insights"
    >
      <div className="space-y-6">
        <WeightTracker />
        <div className="grid gap-6 lg:grid-cols-2">
          <WeeklyChart />
          <MacroBreakdown />
          <StreakDisplay />
          <GoalProgress />
        </div>
      </div>
    </PageContainer>
  )
}
