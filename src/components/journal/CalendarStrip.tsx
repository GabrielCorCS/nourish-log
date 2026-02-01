import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'
import { getWeekDates, formatDate, isToday, isSameDayAs, addDays, subDays } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface CalendarStripProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function CalendarStrip({ selectedDate, onDateChange }: CalendarStripProps) {
  const weekDates = getWeekDates(selectedDate)

  const handlePrevWeek = () => {
    onDateChange(subDays(selectedDate, 7))
  }

  const handleNextWeek = () => {
    onDateChange(addDays(selectedDate, 7))
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        onClick={handlePrevWeek}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1 flex justify-between gap-1 overflow-x-auto no-scrollbar">
        {weekDates.map((date) => {
          const isSelected = isSameDayAs(date, selectedDate)
          const isTodayDate = isToday(date)

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateChange(date)}
              className={cn(
                'flex flex-col items-center justify-center py-2 px-3 rounded-button min-w-[50px]',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-caramel focus:ring-offset-2',
                isSelected
                  ? 'bg-caramel text-white'
                  : isTodayDate
                    ? 'bg-caramel/10 text-caramel'
                    : 'hover:bg-latte/30 text-espresso'
              )}
            >
              <span className="text-[10px] uppercase font-medium opacity-70">
                {formatDate(date, 'EEE')}
              </span>
              <span className="text-lg font-semibold">
                {formatDate(date, 'd')}
              </span>
            </button>
          )
        })}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 flex-shrink-0"
        onClick={handleNextWeek}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
