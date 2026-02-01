import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button, Card } from '@/components/ui'
import { CalendarStrip, DayView } from '@/components/journal'
import { LogMealModal } from '@/components/logging'
import { useUIStore } from '@/stores'
import { getFriendlyDateLabel } from '@/lib/dates'

export function Journal() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const openLogMealModal = useUIStore((state) => state.openLogMealModal)

  return (
    <PageContainer
      title="Journal"
      description={getFriendlyDateLabel(selectedDate)}
      action={
        <Button
          onClick={openLogMealModal}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Log Meal
        </Button>
      }
    >
      <div className="space-y-6">
        <Card variant="elevated" padding="md">
          <CalendarStrip
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </Card>

        <DayView date={selectedDate} />
      </div>

      <LogMealModal />
    </PageContainer>
  )
}
