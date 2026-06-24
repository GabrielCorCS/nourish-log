import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EMOJI_GROUPS } from '@/lib/constants'
import { Button, Input } from '@/components/ui'

interface EmojiPickerProps {
  value?: string | null
  onChange: (emoji: string) => void
  className?: string
}

function EmojiButton({
  emoji,
  active,
  onClick,
}: {
  emoji: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded text-lg transition-colors hover:bg-latte/30',
        active && 'bg-caramel/20'
      )}
    >
      {emoji}
    </button>
  )
}

export function EmojiPicker({ value, onChange, className }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const q = search.trim().toLowerCase()

  // Flat, de-duplicated match list when searching across every group.
  const matches = useMemo(() => {
    if (!q) return null
    const seen = new Set<string>()
    const out: string[] = []
    for (const group of EMOJI_GROUPS) {
      const groupHit = group.label.toLowerCase().includes(q)
      for (const item of group.items) {
        if (seen.has(item.emoji)) continue
        if (groupHit || item.keywords.includes(q)) {
          seen.add(item.emoji)
          out.push(item.emoji)
        }
      }
    }
    return out
  }, [q])

  const close = () => {
    setIsOpen(false)
    setSearch('')
  }

  const pick = (emoji: string) => {
    onChange(emoji)
    close()
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={cn(
          'flex h-12 w-12 items-center justify-center',
          'rounded-input border border-latte bg-cream text-2xl',
          'transition-colors hover:bg-latte/20',
          'focus:outline-none focus:ring-2 focus:ring-caramel'
        )}
      >
        {value || '🍽️'}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={close} />
          <div className="absolute left-0 top-full z-20 mt-2 w-72 animate-scale-in rounded-card bg-warm-white p-3 shadow-soft-lg">
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search emojis…"
              leftIcon={<Search className="h-4 w-4" />}
            />

            <div className="mt-2 max-h-64 overflow-y-auto pr-0.5">
              {matches ? (
                matches.length > 0 ? (
                  <div className="grid grid-cols-7 gap-1">
                    {matches.map((emoji) => (
                      <EmojiButton
                        key={emoji}
                        emoji={emoji}
                        active={value === emoji}
                        onClick={() => pick(emoji)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="px-1 py-4 text-center text-sm text-espresso/40">
                    No emojis found
                  </p>
                )
              ) : (
                EMOJI_GROUPS.map((group) => (
                  <div key={group.label} className="mb-2 last:mb-0">
                    <p className="mb-1 px-1 text-[11px] font-bold uppercase tracking-wide text-espresso/45">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-7 gap-1">
                      {group.items.map((item) => (
                        <EmojiButton
                          key={item.emoji}
                          emoji={item.emoji}
                          active={value === item.emoji}
                          onClick={() => pick(item.emoji)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-2 border-t border-latte pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onChange('')
                  close()
                }}
                className="w-full text-sm"
              >
                Clear
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
