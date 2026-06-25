import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Button,
  Input,
} from '@/components/ui'
import { useAvailabilityWindows, useUpcomingTasksFor, useCreateCalendarTask } from '@/hooks'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/dates'
import { findNextSlot, formatTimeRange, TASK_DURATIONS } from '@/lib/schedule'
import type { AppUser } from '@/types/database'

interface TaskFormProps {
  members: AppUser[]
  defaultAssigneeId?: string
  onClose: () => void
}

export function TaskForm({ members, defaultAssigneeId, onClose }: TaskFormProps) {
  const addToast = useUIStore((s) => s.addToast)
  const create = useCreateCalendarTask()
  const { data: windows } = useAvailabilityWindows()

  const [assignee, setAssignee] = useState(defaultAssigneeId ?? members[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState<number>(15)
  const [earliest, setEarliest] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState<string | null>(null)

  const { data: bookingsData } = useUpcomingTasksFor(assignee)

  const slot = useMemo(() => {
    if (!assignee || !windows) return null
    const dayStart = new Date(`${earliest}T00:00:00`)
    const from = dayStart.getTime() > Date.now() ? dayStart : new Date()
    const bookings = (bookingsData ?? []).map((t) => ({
      start: new Date(t.scheduled_start),
      end: new Date(t.scheduled_end),
    }))
    return findNextSlot({
      windows: windows.filter((w) => w.user_id === assignee),
      bookings,
      durationMin: duration,
      from,
    })
  }, [assignee, windows, bookingsData, duration, earliest])

  const assigneeName = members.find((m) => m.id === assignee)?.name ?? 'them'

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Give the task a title')
      return
    }
    if (!slot) {
      setError('No open slot — check their allow times')
      return
    }
    try {
      await create.mutateAsync({
        assignee_user_id: assignee,
        title: title.trim(),
        duration_minutes: duration,
        scheduled_start: slot.start.toISOString(),
        scheduled_end: slot.end.toISOString(),
      })
      addToast('Task scheduled', 'success')
      onClose()
    } catch {
      addToast('Could not schedule the task', 'error')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <div>
            <p className="mb-1.5 text-sm font-medium text-espresso">For</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setAssignee(m.id)}
                  className={cn(
                    'pressable flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition-colors',
                    assignee === m.id
                      ? 'bg-emerald/12 text-emerald-dark ring-emerald/30'
                      : 'bg-cream text-espresso/60 ring-latte hover:text-espresso'
                  )}
                >
                  <span className="text-base">{m.avatar_emoji || '👤'}</span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Task"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setError(null)
            }}
            placeholder="e.g., Walk the dog"
            error={error ?? undefined}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-espresso">Duration</p>
            <div className="grid grid-cols-3 gap-2">
              {TASK_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={cn(
                    'pressable rounded-[12px] border py-2.5 text-sm font-semibold transition-colors',
                    duration === d
                      ? 'border-emerald/30 bg-emerald/10 text-emerald-dark ring-1 ring-emerald/20'
                      : 'border-latte text-espresso/60 hover:bg-cream'
                  )}
                >
                  {d === 60 ? '1 hour' : `${d} min`}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Earliest day"
            type="date"
            value={earliest}
            onChange={(e) => setEarliest(e.target.value)}
          />

          <div className="rounded-[16px] bg-gradient-to-br from-emerald/[0.10] to-emerald/[0.03] p-4 ring-1 ring-emerald/15">
            {slot ? (
              <>
                <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                  Will book
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-espresso">
                  {formatDate(slot.start, 'EEEE, MMM d')}
                </p>
                <p className="metric text-sm text-emerald-dark">
                  {formatTimeRange(slot.start, slot.end)}
                </p>
              </>
            ) : (
              <p className="text-sm text-espresso/60">
                No open slot for {assigneeName}. Set their allow times first.
              </p>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={create.isPending} disabled={!slot}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
