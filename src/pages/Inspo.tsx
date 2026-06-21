import { useState } from 'react'
import { Plus, Sparkles, Check, Trash2, ExternalLink } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button, Input } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import {
  useWishlist,
  useAddWishlistItem,
  useToggleWishlistDone,
  useDeleteWishlistItem,
} from '@/hooks/useWishlist'
import { useHousehold } from '@/hooks/useHousehold'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

export function Inspo() {
  const addToast = useUIStore((s) => s.addToast)
  const { data: items, isLoading } = useWishlist()
  const { data: household } = useHousehold()
  const addItem = useAddWishlistItem()
  const toggleDone = useToggleWishlistDone()
  const deleteItem = useDeleteWishlistItem()

  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [url, setUrl] = useState('')

  const memberName = (id: string | null) =>
    household?.members.find((m) => m.id === id)?.name ?? 'Someone'
  const memberEmoji = (id: string | null) =>
    household?.members.find((m) => m.id === id)?.avatar_emoji ?? '👤'

  const handleAdd = async () => {
    if (!title.trim()) return
    try {
      await addItem.mutateAsync({
        title: title.trim(),
        note: note.trim() || null,
        url: url.trim() || null,
      })
      setTitle('')
      setNote('')
      setUrl('')
      setAdding(false)
      addToast('Added to your board', 'success')
    } catch {
      addToast('Failed to add', 'error')
    }
  }

  const pending = items?.filter((i) => !i.is_done) ?? []
  const done = items?.filter((i) => i.is_done) ?? []

  return (
    <PageContainer
      title="Inspo"
      description="A shared board for things you're craving"
      action={
        <Button onClick={() => setAdding((v) => !v)} leftIcon={<Plus className="h-4 w-4" />}>
          Add
        </Button>
      }
    >
      {/* Hero banner */}
      <div className="relative mb-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-6 text-white">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.45), transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full opacity-35 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.4), transparent 70%)' }}
        />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-lime/90">
              Shared board
            </span>
            <h1 className="mt-1 font-display text-title font-semibold text-white">
              Inspo
            </h1>
            <p className="mt-1.5 text-sm text-white/65">
              Things you're craving — your partner sees it too.
            </p>
          </div>
          <div className="metric shrink-0 text-right">
            <span className="text-3xl font-bold text-white">{pending.length}</span>
            <span className="block text-[11px] font-medium uppercase tracking-wide text-white/50">
              to try
            </span>
          </div>
        </div>
      </div>

      {/* Add form tile */}
      {adding && (
        <div className="mb-5 rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60 space-y-3 animate-slide-up">
          <h2 className="font-display text-lg font-semibold text-espresso">New idea</h2>
          <Input
            label="What do you want?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., that ramen place, or homemade sushi night"
          />
          <Input
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Input
            label="Link (optional)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} isLoading={addItem.isPending}>
              Add
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <LoadingState message="Loading your board…" />
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="Nothing here yet"
          description="Add something you're craving — your partner will see it"
          action={{ label: 'Add idea', onClick: () => setAdding(true) }}
        />
      ) : (
        <div className="space-y-5">
          {/* Pending items */}
          {pending.length > 0 && (
            <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-espresso/55">
                To try · {pending.length}
              </p>
              <ul className="stagger space-y-2">
                {pending.map((item) => (
                  <InspoItem
                    key={item.id}
                    item={item}
                    memberEmoji={memberEmoji}
                    memberName={memberName}
                    onToggle={() => toggleDone.mutate({ id: item.id, isDone: !item.is_done })}
                    onDelete={() => deleteItem.mutate(item.id)}
                  />
                ))}
              </ul>
            </div>
          )}

          {/* Done items */}
          {done.length > 0 && (
            <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60 opacity-70">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-espresso/40">
                Done · {done.length}
              </p>
              <ul className="space-y-2">
                {done.map((item) => (
                  <InspoItem
                    key={item.id}
                    item={item}
                    memberEmoji={memberEmoji}
                    memberName={memberName}
                    onToggle={() => toggleDone.mutate({ id: item.id, isDone: !item.is_done })}
                    onDelete={() => deleteItem.mutate(item.id)}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}

// ─── Sub-component: a single Inspo card ─────────────────────────────────────

interface InspoItemProps {
  item: {
    id: string
    title: string
    note: string | null
    url: string | null
    is_done: boolean
    created_by: string | null
  }
  memberEmoji: (id: string | null) => string
  memberName: (id: string | null) => string
  onToggle: () => void
  onDelete: () => void
}

function InspoItem({ item, memberEmoji, memberName, onToggle, onDelete }: InspoItemProps) {
  return (
    <li className="pressable flex items-start gap-3 rounded-[22px] bg-cream/70 px-4 py-3 ring-1 ring-latte/40 transition-colors hover:bg-cream">
      {/* Done toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={item.is_done ? 'Mark undone' : 'Mark done'}
        className={cn(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors',
          item.is_done
            ? 'border-emerald bg-emerald text-white'
            : 'border-latte hover:border-emerald'
        )}
      >
        {item.is_done && <Check className="h-3 w-3" />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'font-medium text-espresso leading-snug',
            item.is_done && 'line-through text-espresso/40'
          )}
        >
          {item.title}
        </p>
        {item.note && (
          <p className="mt-0.5 text-sm text-espresso/55">{item.note}</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-espresso/40">
          <span>
            {memberEmoji(item.created_by)} {memberName(item.created_by)}
          </span>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-emerald hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> link
            </a>
          )}
        </div>
      </div>

      {/* Delete */}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 text-terracotta hover:bg-terracotta/10"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </li>
  )
}
