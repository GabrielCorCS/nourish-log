import { useState } from 'react'
import { Plus, Sparkles, Check, Trash2, ExternalLink } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
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
      {adding && (
        <Card variant="elevated" padding="lg" className="mb-4 space-y-3">
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
            placeholder="https://..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} isLoading={addItem.isPending}>
              Add
            </Button>
          </div>
        </Card>
      )}

      {isLoading ? (
        <LoadingState message="Loading your board..." />
      ) : !items || items.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-8 w-8" />}
          title="Nothing here yet"
          description="Add something you're craving — your partner will see it"
          action={{ label: 'Add idea', onClick: () => setAdding(true) }}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card key={item.id} variant="elevated" padding="sm">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => toggleDone.mutate({ id: item.id, isDone: !item.is_done })}
                  className={cn(
                    'mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors',
                    item.is_done
                      ? 'bg-sage border-sage text-warm-white'
                      : 'border-latte hover:border-sage'
                  )}
                >
                  {item.is_done && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'font-medium text-espresso',
                      item.is_done && 'line-through text-espresso/40'
                    )}
                  >
                    {item.title}
                  </p>
                  {item.note && <p className="text-sm text-espresso/60">{item.note}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-espresso/40">
                    <span>
                      {memberEmoji(item.created_by)} {memberName(item.created_by)}
                    </span>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-caramel hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> link
                      </a>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-terracotta"
                  onClick={() => deleteItem.mutate(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
