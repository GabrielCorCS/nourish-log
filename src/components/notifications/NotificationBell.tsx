import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  type AppNotification,
} from '@/hooks'

const TYPE_ICON: Record<string, string> = {
  weigh_in: '⚖️',
  proxy_log: '🍽️',
  calendar_task: '📅',
  day_report: '📊',
}

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const items = data ?? []
  const unread = items.filter((n) => !n.is_read).length

  const handleClick = (n: AppNotification) => {
    if (!n.is_read) markRead.mutate(n.id)
    // The daily report opens its full page; other types just mark read.
    if (n.type === 'day_report') {
      navigate(n.data?.date ? `/report/${n.data.date}` : '/report')
      setOpen(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-full text-espresso/60 transition-colors hover:bg-cream hover:text-espresso"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-0 top-0 grid h-4 min-w-[1rem] place-items-center rounded-full bg-terracotta px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] animate-scale-in overflow-hidden rounded-card bg-warm-white shadow-soft-lg ring-1 ring-latte/60">
            <div className="flex items-center justify-between border-b border-latte px-4 py-3">
              <p className="font-display font-semibold text-espresso">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => markAll.mutate()}
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-dark hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-espresso/45">
                  You're all caught up ✨
                </p>
              ) : (
                items.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleClick(n)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-cream',
                      !n.is_read && 'bg-emerald/[0.04]'
                    )}
                  >
                    <span className="mt-0.5 text-lg leading-none">
                      {TYPE_ICON[n.type] ?? '🔔'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm text-espresso', !n.is_read && 'font-semibold')}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p
                          className={cn(
                            'text-xs text-espresso/55',
                            n.type === 'day_report'
                              ? 'mt-0.5 whitespace-pre-line leading-relaxed'
                              : 'truncate'
                          )}
                        >
                          {n.body}
                        </p>
                      )}
                      {n.type === 'day_report' && (
                        <p className="mt-1 text-[11px] font-semibold text-emerald-dark">
                          View full report →
                        </p>
                      )}
                      <p className="mt-0.5 text-[11px] text-espresso/35">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
