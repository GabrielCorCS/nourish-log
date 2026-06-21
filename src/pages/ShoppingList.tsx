import { useState } from 'react'
import { PageContainer } from '@/components/layout'
import { Button, Dialog } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import { useShoppingList } from '@/hooks/useShoppingList'
import { useIngredients } from '@/hooks'
import { ShoppingCart, Plus, Trash2, CheckCircle2, Circle, Sparkles } from 'lucide-react'
import type { Ingredient } from '@/types/database'
import { cn } from '@/lib/utils'

export function ShoppingList() {
  const { items, isLoading, togglePurchased, removeItem, clearPurchased, addItem } = useShoppingList()
  const { data: ingredients = [] } = useIngredients()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [quantity, setQuantity] = useState('1')

  const purchasedCount = items.filter((item) => item.is_purchased).length
  const pendingItems = items.filter((item) => !item.is_purchased)
  const purchasedItems = items.filter((item) => item.is_purchased)

  const availableIngredients = ingredients.filter(
    (ing: Ingredient) => !items.some((item) => item.ingredient_id === ing.id)
  )

  async function handleAdd() {
    if (!selectedIngredient) return
    await addItem({
      ingredient_id: selectedIngredient,
      quantity_needed: Number(quantity) || 1,
    })
    setIsAddOpen(false)
    setSelectedIngredient('')
    setQuantity('1')
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading shopping list..." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Page header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            Groceries
          </p>
          <h1 className="font-display text-display font-semibold text-espresso">
            Shopping List
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {purchasedCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => clearPurchased()}>
              Clear done
            </Button>
          )}
          <Button onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
            Add Item
          </Button>
        </div>
      </div>

      {/* Progress hero tile — only when there are items */}
      {items.length > 0 && (
        <div className="relative mb-5 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-5 text-white">
          {/* Ambient glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.4), transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-6 h-36 w-36 rounded-full opacity-35 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.35), transparent 70%)' }}
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime/90">
                Today&rsquo;s run
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-4xl font-semibold leading-none text-white">
                  {pendingItems.length}
                </span>
                <span className="metric text-base font-medium text-white/70">
                  to buy
                </span>
              </div>
            </div>
            {purchasedCount > 0 && (
              <div className="metric rounded-full bg-white/10 px-3 py-1.5 text-sm font-semibold text-white/85 ring-1 ring-white/15">
                {purchasedCount} done
              </div>
            )}
          </div>
          {items.length > 0 && (
            <div className="relative mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lime to-emerald transition-[width] duration-700 ease-spring"
                  style={{ width: `${(purchasedCount / items.length) * 100}%` }}
                />
              </div>
              <div className="metric mt-1.5 flex justify-between text-xs text-white/50">
                <span>{purchasedCount} checked</span>
                <span>{items.length} total</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List content */}
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="h-12 w-12" />}
          title="Shopping list is empty"
          description="Items are automatically added when inventory runs low, or add them manually"
          action={{
            label: 'Add Item',
            onClick: () => setIsAddOpen(true),
          }}
        />
      ) : (
        <div className="space-y-5">
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                To buy
              </p>
              <div className="stagger space-y-2">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="pressable flex items-center gap-3 rounded-[22px] bg-warm-white p-4 ring-1 ring-latte/60"
                  >
                    <button
                      type="button"
                      onClick={() => togglePurchased(item.id, true)}
                      className="shrink-0 text-espresso/30 transition-colors hover:text-emerald"
                      aria-label="Mark as purchased"
                    >
                      <Circle className="h-6 w-6" />
                    </button>
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-2xl leading-none">{item.ingredient?.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-espresso">
                          {item.ingredient?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="metric text-xs text-espresso/55">
                            Qty: {item.quantity_needed}
                          </span>
                          {item.auto_added && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-honey/15 px-2 py-0.5 text-xs font-semibold text-[#A9791B]">
                              <Sparkles className="h-3 w-3" />
                              Auto
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 shrink-0 text-espresso/25 hover:text-terracotta hover:bg-terracotta/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchased Items */}
          {purchasedItems.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Purchased
              </p>
              <div className="space-y-2">
                {purchasedItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'pressable flex items-center gap-3 rounded-[22px] p-4 opacity-60',
                      'bg-gradient-to-br from-emerald/[0.08] to-emerald/[0.03] ring-1 ring-emerald/15'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => togglePurchased(item.id, false)}
                      className="shrink-0 text-emerald transition-colors hover:text-emerald-dark"
                      aria-label="Mark as unpurchased"
                    >
                      <CheckCircle2 className="h-6 w-6" />
                    </button>
                    <div className="flex flex-1 items-center gap-3">
                      <span className="text-2xl leading-none">{item.ingredient?.emoji}</span>
                      <p className="flex-1 font-semibold text-espresso line-through">
                        {item.ingredient?.name}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 shrink-0 text-espresso/25 hover:text-terracotta hover:bg-terracotta/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <div className="p-6 space-y-4">
          <h2 className="font-display text-title font-semibold text-espresso">
            Add to Shopping List
          </h2>

          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                Ingredient
              </span>
              <select
                value={selectedIngredient}
                onChange={(e) => setSelectedIngredient(e.target.value)}
                className="mt-1.5 w-full rounded-input border border-latte bg-warm-white p-2.5 text-espresso focus:border-emerald focus:outline-none"
              >
                <option value="">Select an ingredient</option>
                {availableIngredients.map((ing: Ingredient) => (
                  <option key={ing.id} value={ing.id}>
                    {ing.emoji} {ing.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                Quantity
              </span>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1.5 w-full rounded-input border border-latte bg-warm-white p-2.5 text-espresso focus:border-emerald focus:outline-none"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleAdd} className="flex-1">
              Add to List
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </PageContainer>
  )
}
