import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    <div className="flex items-center gap-1">
      {/* Prev week chevron */}
      <button
        type="button"
        aria-label="Previous week"
        onClick={handlePrevWeek}
        className="pressable flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-espresso/50 transition-colors hover:bg-latte/40 hover:text-espresso"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {/* Date pills */}
      <div className="no-scrollbar flex flex-1 items-center justify-between gap-1 overflow-x-auto">
        {weekDates.map((date) => {
          const isSelected = isSameDayAs(date, selectedDate)
          const isTodayDate = isToday(date)

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onDateChange(date)}
              className={cn(
                'pressable flex min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-full px-3 py-2',
                'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald focus-visible:ring-offset-2',
                isSelected
                  ? 'bg-gradient-to-b from-emerald to-emerald-dark text-white shadow-glow'
                  : isTodayDate
                    ? 'bg-emerald/10 text-emerald'
                    : 'text-espresso hover:bg-latte/40'
              )}
            >
              <span
                className={cn(
                  'text-[10px] font-bold uppercase tracking-wide',
                  isSelected ? 'text-white/75' : isTodayDate ? 'text-emerald/70' : 'text-espresso/45'
                )}
              >
                {formatDate(date, 'EEE')}
              </span>
              <span className="metric text-[15px] font-bold leading-none">
                {formatDate(date, 'd')}
              </span>
            </button>
          )
        })}
      </div>

      {/* Next week chevron */}
      <button
        type="button"
        aria-label="Next week"
        onClick={handleNextWeek}
        className="pressable flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-espresso/50 transition-colors hover:bg-latte/40 hover:text-espresso"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
