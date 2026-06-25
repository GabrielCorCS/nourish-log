// Scheduling helpers for the in-app Schedule: time formatting and the
// auto-slotting engine that books a task into the next free slot of an
// assignee's weekly availability, rounded up to the next :00 / :30.

export const TASK_DURATIONS = [15, 30, 60] as const
export type TaskDuration = (typeof TASK_DURATIONS)[number]

export const WEEKDAY_LABELS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export interface AvailabilityWindow {
  user_id: string
  weekday: number
  start_minute: number
  end_minute: number
}

export interface Booking {
  start: Date
  end: Date
}

/** Minutes-from-midnight → "9:05 AM". */
export function minutesToLabel(m: number): string {
  const total = ((Math.round(m) % 1440) + 1440) % 1440
  let h = Math.floor(total / 60)
  const min = total % 60
  const ampm = h < 12 ? 'AM' : 'PM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${min.toString().padStart(2, '0')} ${ampm}`
}

/** Minutes-from-midnight → "09:05" for an <input type="time">. */
export function minutesToTimeInput(m: number): string {
  const total = ((Math.round(m) % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const min = total % 60
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

/** "09:05" → minutes-from-midnight (null if blank/invalid). */
export function timeInputToMinutes(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function formatTimeRange(start: Date, end: Date): string {
  const m = (d: Date) => d.getHours() * 60 + d.getMinutes()
  return `${minutesToLabel(m(start))} – ${minutesToLabel(m(end))}`
}

const roundUpTo30 = (m: number) => Math.ceil(m / 30) * 30

/**
 * First open slot (start rounded up to the next :00 / :30) for `durationMin`
 * that fits inside one of the assignee's availability windows and doesn't
 * overlap their existing bookings, starting no earlier than `from`.
 */
export function findNextSlot(params: {
  windows: AvailabilityWindow[]
  bookings: Booking[]
  durationMin: number
  from: Date
  horizonDays?: number
}): { start: Date; end: Date } | null {
  const { windows, bookings, durationMin, from, horizonDays = 28 } = params

  for (let d = 0; d <= horizonDays; d++) {
    const day = new Date(from)
    day.setDate(day.getDate() + d)
    day.setHours(0, 0, 0, 0)
    const dayMs = day.getTime()
    const nextDayMs = dayMs + 86400000
    const weekday = day.getDay()

    const dayWindows = windows
      .filter((w) => w.weekday === weekday && w.end_minute > w.start_minute)
      .sort((a, b) => a.start_minute - b.start_minute)
    if (!dayWindows.length) continue

    const dayBookings = bookings
      .filter((b) => b.end.getTime() > dayMs && b.start.getTime() < nextDayMs)
      .sort((a, b) => a.start.getTime() - b.start.getTime())

    const fromMinute = d === 0 ? Math.max(0, (from.getTime() - dayMs) / 60000) : 0

    for (const w of dayWindows) {
      let candidate = roundUpTo30(Math.max(w.start_minute, fromMinute))
      let guard = 0
      while (candidate + durationMin <= w.end_minute && guard++ < 300) {
        const start = new Date(dayMs + candidate * 60000)
        const end = new Date(start.getTime() + durationMin * 60000)
        const conflict = dayBookings.find((b) => start < b.end && end > b.start)
        if (!conflict) return { start, end }
        candidate = roundUpTo30((conflict.end.getTime() - dayMs) / 60000)
      }
    }
  }
  return null
}
