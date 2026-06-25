import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  Button,
} from '@/components/ui'
import {
  useAvailabilityWindows,
  useUpsertAvailabilityWindow,
  useDeleteAvailabilityWindow,
} from '@/hooks'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'
import { WEEKDAY_SHORT, minutesToTimeInput, timeInputToMinutes } from '@/lib/schedule'
import type { AppUser } from '@/types/database'

interface AvailabilityEditorProps {
  members: AppUser[]
  onClose: () => void
}

type Row = { start: string; end: string }

export function AvailabilityEditor({ members, onClose }: AvailabilityEditorProps) {
  const addToast = useUIStore((s) => s.addToast)
  const { data: windows } = useAvailabilityWindows()
  const upsert = useUpsertAvailabilityWindow()
  const del = useDeleteAvailabilityWindow()

  const [userId, setUserId] = useState(members[0]?.id ?? '')
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: 7 }, () => ({ start: '', end: '' }))
  )

  useEffect(() => {
    const next: Row[] = Array.from({ length: 7 }, () => ({ start: '', end: '' }))
    for (const w of windows ?? []) {
      if (w.user_id === userId) {
        next[w.weekday] = {
          start: minutesToTimeInput(w.start_minute),
          end: minutesToTimeInput(w.end_minute),
        }
      }
    }
    setRows(next)
  }, [userId, windows])

  const setRow = (i: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))

  const handleSave = async () => {
    try {
      for (let wd = 0; wd < 7; wd++) {
        const r = rows[wd]
        const s = timeInputToMinutes(r.start)
        const e = timeInputToMinutes(r.end)
        if (s != null && e != null && e > s) {
          await upsert.mutateAsync({ user_id: userId, weekday: wd, start_minute: s, end_minute: e })
        } else if (!r.start && !r.end) {
          await del.mutateAsync({ user_id: userId, weekday: wd })
        }
      }
      addToast('Allow times saved', 'success')
      onClose()
    } catch {
      addToast('Could not save allow times', 'error')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Allow times</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <p className="text-sm text-espresso/55">
            When each person can be booked. Leave a day blank for no availability.
          </p>

          {members.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setUserId(m.id)}
                  className={cn(
                    'pressable flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 transition-colors',
                    userId === m.id
                      ? 'bg-emerald/12 text-emerald-dark ring-emerald/30'
                      : 'bg-cream text-espresso/60 ring-latte hover:text-espresso'
                  )}
                >
                  <span className="text-base">{m.avatar_emoji || '👤'}</span>
                  {m.name}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {WEEKDAY_SHORT.map((label, wd) => (
              <div key={label} className="flex items-center gap-2">
                <span className="w-9 shrink-0 text-sm font-semibold text-espresso/70">
                  {label}
                </span>
                <input
                  type="time"
                  value={rows[wd].start}
                  onChange={(e) => setRow(wd, { start: e.target.value })}
                  className="h-10 min-w-0 flex-1 rounded-input border border-latte bg-warm-white px-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-emerald/60"
                />
                <span className="text-espresso/40">–</span>
                <input
                  type="time"
                  value={rows[wd].end}
                  onChange={(e) => setRow(wd, { end: e.target.value })}
                  className="h-10 min-w-0 flex-1 rounded-input border border-latte bg-warm-white px-2 text-sm text-espresso focus:outline-none focus:ring-2 focus:ring-emerald/60"
                />
                <button
                  type="button"
                  aria-label={`Clear ${label}`}
                  onClick={() => setRow(wd, { start: '', end: '' })}
                  className="pressable grid h-8 w-8 shrink-0 place-items-center rounded-full text-espresso/30 hover:bg-latte/40 hover:text-espresso/60"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={upsert.isPending || del.isPending}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
