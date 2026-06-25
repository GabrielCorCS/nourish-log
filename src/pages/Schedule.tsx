import { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarClock,
  Trash2,
  SlidersHorizontal,
} from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import { TaskForm } from '@/components/schedule/TaskForm'
import { AvailabilityEditor } from '@/components/schedule/AvailabilityEditor'
import {
  useHousehold,
  useCalendarTasks,
  useAvailabilityWindows,
  useDeleteCalendarTask,
} from '@/hooks'
import { formatDate } from '@/lib/dates'
import { formatTimeRange, minutesToLabel } from '@/lib/schedule'
import { cn } from '@/lib/utils'

// Color-code tasks/availability by household member.
const PERSON_STYLES = [
  { ring: 'ring-emerald/25', bg: 'from-emerald/[0.10] to-emerald/[0.03]', dot: 'bg-emerald', text: 'text-emerald-dark' },
  { ring: 'ring-blush/30', bg: 'from-blush/[0.14] to-blush/[0.04]', dot: 'bg-blush', text: 'text-[#C13C7E]' },
  { ring: 'ring-honey/30', bg: 'from-honey/[0.16] to-honey/[0.05]', dot: 'bg-honey', text: 'text-[#A9791B]' },
]

export function Schedule() {
  const { data: household } = useHousehold()
  const members = household?.members ?? []

  const [date, setDate] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [showTask, setShowTask] = useState(false)
  const [showAvail, setShowAvail] = useState(false)

  const dayStart = new Date(date)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const { data: tasks, isLoading } = useCalendarTasks({ start: dayStart, end: dayEnd })
  const { data: windows } = useAvailabilityWindows()
  const deleteTask = useDeleteCalendarTask()

  const styleFor = (userId: string) => {
    const idx = members.findIndex((m) => m.id === userId)
    return PERSON_STYLES[(idx < 0 ? 0 : idx) % PERSON_STYLES.length]
  }
  const memberFor = (userId: string) => members.find((m) => m.id === userId)
  const weekday = date.getDay()
  const isToday = date.toDateString() === new Date().toDateString()
  const shiftDay = (n: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + n)
    setDate(d)
  }

  return (
    <PageContainer>
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">Together</p>
          <h1 className="font-display text-display font-semibold text-espresso">Schedule</h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAvail(true)}
            leftIcon={<SlidersHorizontal className="h-4 w-4" />}
          >
            Allow times
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={() => setShowTask(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New task
          </Button>
        </div>
      </div>

      {/* Date nav */}
      <div className="mb-4 flex items-center justify-between rounded-[22px] bg-warm-white p-3 ring-1 ring-latte/60">
        <button
          type="button"
          onClick={() => shiftDay(-1)}
          aria-label="Previous day"
          className="pressable grid h-9 w-9 place-items-center rounded-full hover:bg-cream"
        >
          <ChevronLeft className="h-5 w-5 text-espresso/60" />
        </button>
        <button
          type="button"
          onClick={() => {
            const d = new Date()
            d.setHours(0, 0, 0, 0)
            setDate(d)
          }}
          className="text-center"
        >
          <p className="font-display font-semibold text-espresso">{formatDate(date, 'EEEE')}</p>
          <p className="metric text-xs text-espresso/50">
            {formatDate(date, 'MMMM d')}
            {isToday ? ' · Today' : ''}
          </p>
        </button>
        <button
          type="button"
          onClick={() => shiftDay(1)}
          aria-label="Next day"
          className="pressable grid h-9 w-9 place-items-center rounded-full hover:bg-cream"
        >
          <ChevronRight className="h-5 w-5 text-espresso/60" />
        </button>
      </div>

      {/* Allow-time per person for this weekday */}
      {members.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {members.map((m) => {
            const w = (windows ?? []).find((x) => x.user_id === m.id && x.weekday === weekday)
            const st = styleFor(m.id)
            return (
              <span
                key={m.id}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br px-3 py-1.5 text-xs font-semibold ring-1',
                  st.bg,
                  st.ring
                )}
              >
                <span className="text-sm">{m.avatar_emoji || '👤'}</span>
                <span className="text-espresso/70">{m.name}:</span>
                <span className={st.text}>
                  {w ? `${minutesToLabel(w.start_minute)} – ${minutesToLabel(w.end_minute)}` : 'unset'}
                </span>
              </span>
            )
          })}
        </div>
      )}

      {/* Tasks */}
      {isLoading ? (
        <LoadingState message="Loading schedule…" />
      ) : (tasks ?? []).length === 0 ? (
        <EmptyState
          icon={<CalendarClock className="h-8 w-8" />}
          title="Nothing scheduled"
          description="Add a task to fill this day."
          action={{ label: 'New task', onClick: () => setShowTask(true) }}
        />
      ) : (
        <ul className="stagger space-y-2.5">
          {(tasks ?? []).map((t) => {
            const st = styleFor(t.assignee_user_id)
            const who = memberFor(t.assignee_user_id)
            const start = new Date(t.scheduled_start)
            const end = new Date(t.scheduled_end)
            return (
              <li
                key={t.id}
                className={cn(
                  'flex items-center gap-3 rounded-[20px] bg-gradient-to-br p-4 ring-1',
                  st.bg,
                  st.ring
                )}
              >
                <div className="flex w-16 shrink-0 flex-col items-center">
                  <span className="metric text-sm font-bold text-espresso">
                    {minutesToLabel(start.getHours() * 60 + start.getMinutes())}
                  </span>
                  <span className="text-[10px] text-espresso/40">{t.duration_minutes}m</span>
                </div>
                <div className={cn('h-10 w-1 shrink-0 rounded-full', st.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-espresso">{t.title}</p>
                  <p className="metric text-xs text-espresso/50">
                    {formatTimeRange(start, end)} · {who?.avatar_emoji || '👤'} {who?.name ?? 'someone'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-espresso/30 hover:bg-terracotta/10 hover:text-terracotta"
                  onClick={() => deleteTask.mutate(t.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      {showTask && <TaskForm members={members} onClose={() => setShowTask(false)} />}
      {showAvail && <AvailabilityEditor members={members} onClose={() => setShowAvail(false)} />}
    </PageContainer>
  )
}
