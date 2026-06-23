import { useState } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui'
import { CalendarStrip, DayView } from '@/components/journal'
import { PersonToggle } from '@/components/shared'
import { useUIStore } from '@/stores'
import { formatDate } from '@/lib/dates'

export function Journal() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const openLogMealModal = useUIStore((state) => state.openLogMealModal)

  return (
    <PageContainer>
      <PersonToggle className="mb-4" />

      {/* Page header — mirrors Dashboard greeting layout */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            Food Journal
          </p>
          <h1 className="font-display text-display font-semibold text-espresso">
            {formatDate(selectedDate, 'MMMM d')}
          </h1>
        </div>
        <Button
          onClick={openLogMealModal}
          leftIcon={<Plus className="h-4 w-4" />}
          className="hidden shrink-0 sm:inline-flex"
        >
          Log meal
        </Button>
      </div>

      {/* Calendar strip — standalone tile */}
      <div className="mb-4 rounded-[28px] bg-warm-white p-4 ring-1 ring-latte/60">
        <CalendarStrip
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      {/* Day content */}
      <DayView date={selectedDate} />
    </PageContainer>
  )
}
