import { TrendingUp } from 'lucide-react'
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
    <PageContainer>
      {/* Page header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            Your journey
          </p>
          <h1 className="font-display text-display font-semibold text-espresso">
            Progress
          </h1>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] ring-1 ring-emerald/20 text-emerald-dark">
          <TrendingUp className="h-5 w-5" />
        </span>
      </div>

      {/* Bento layout */}
      <div className="stagger space-y-4">
        {/* Weight tracker — hero-width tile */}
        <WeightTracker />

        {/* Two-column: weekly chart + streak side by side */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <WeeklyChart />
          <StreakDisplay />
        </div>

        {/* Two-column: macro breakdown + goal progress */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <MacroBreakdown />
          <GoalProgress />
        </div>
      </div>
    </PageContainer>
  )
}
