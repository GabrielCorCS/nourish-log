import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  addDays,
  subDays,
  isToday,
  isYesterday,
  isSameDay,
  differenceInDays,
  eachDayOfInterval,
} from 'date-fns'

// Format date for display
export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr)
}

// Format date for database (ISO string)
export function toISODateString(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

// Parse ISO date string to Date
export function fromISODateString(dateStr: string): Date {
  return parseISO(dateStr)
}

// Get friendly date label
export function getFriendlyDateLabel(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date

  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'

  // Within the past week
  const daysAgo = differenceInDays(new Date(), d)
  if (daysAgo > 0 && daysAgo < 7) {
    return format(d, 'EEEE') // Day name
  }

  // This year
  if (d.getFullYear() === new Date().getFullYear()) {
    return format(d, 'MMM d')
  }

  return format(d, 'MMM d, yyyy')
}

// Get start and end of day for date range queries
export function getDayRange(date: Date): { start: string; end: string } {
  return {
    start: startOfDay(date).toISOString(),
    end: endOfDay(date).toISOString(),
  }
}

// Get dates for week (for calendar strip)
export function getWeekDates(centerDate: Date): Date[] {
  const start = startOfWeek(centerDate, { weekStartsOn: 0 }) // Sunday
  return eachDayOfInterval({
    start,
    end: endOfWeek(centerDate, { weekStartsOn: 0 }),
  })
}

// Get dates for a range
export function getDateRange(startDate: Date, days: number): Date[] {
  return eachDayOfInterval({
    start: startDate,
    end: addDays(startDate, days - 1),
  })
}

// Get past N days
export function getPastDays(days: number): Date[] {
  const today = new Date()
  return getDateRange(subDays(today, days - 1), days)
}

// Check if two dates are the same day
export function isSameDayAs(date1: Date | string, date2: Date | string): boolean {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2
  return isSameDay(d1, d2)
}

// Format time from ISO string
export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'h:mm a')
}

// Get relative time (e.g., "2 hours ago")
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - d.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return 'Just now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return formatDate(d, 'MMM d')
}

export {
  addDays,
  subDays,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  parseISO,
}
