import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui'
import {
  TodaySummary,
  QuickActions,
  MealTimeline,
  StreakCard,
} from '@/components/dashboard'
import { LogMealModal } from '@/components/logging'
import { useUIStore } from '@/stores'

export function Dashboard() {
  const openLogMealModal = useUIStore((state) => state.openLogMealModal)

  return (
    <PageContainer
      title="Dashboard"
      description="Track your daily nutrition"
      action={
        <Button
          onClick={openLogMealModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Log Meal
        </Button>
      }
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <TodaySummary />
          <MealTimeline />
        </div>
        <div className="space-y-6">
          <QuickActions />
          <StreakCard />
        </div>
      </div>

      <LogMealModal />
    </PageContainer>
  )
}
