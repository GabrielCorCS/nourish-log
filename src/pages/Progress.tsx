import { PageContainer } from '@/components/layout'
import {
  WeeklyChart,
  MacroBreakdown,
  StreakDisplay,
  GoalProgress,
} from '@/components/progress'

export function Progress() {
  return (
    <PageContainer
      title="Progress"
      description="Your nutrition insights"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyChart />
        <MacroBreakdown />
        <StreakDisplay />
        <GoalProgress />
      </div>
    </PageContainer>
  )
}
