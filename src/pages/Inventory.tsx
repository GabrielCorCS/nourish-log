import { useState } from 'react'
import { PageContainer } from '@/components/layout'
import { Button, Input, Dialog } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import { useInventory } from '@/hooks/useInventory'
import { useIngredients } from '@/hooks'
import { Package, Plus, AlertTriangle, Edit2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Ingredient } from '@/types/database'

export function Inventory() {
  const { inventory, isLoading, updateInventory, addInventoryItem } = useInventory()
  const { data: ingredients = [] } = useIngredients()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [quantity, setQuantity] = useState('')
  const [threshold, setThreshold] = useState('')
  const [unit, setUnit] = useState('g')

  const lowStockItems = inventory.filter(
    (item) => item.threshold_quantity > 0 && item.quantity_on_hand < item.threshold_quantity
  )

  const availableIngredients = ingredients.filter(
    (ing: Ingredient) => !inventory.some((inv) => inv.ingredient_id === ing.id)
  )

  async function handleAdd() {
    if (!selectedIngredient) return
    await addInventoryItem({
      ingredient_id: selectedIngredient,
      quantity_on_hand: Number(quantity) || 0,
      threshold_quantity: Number(threshold) || 0,
      unit,
    })
    setIsAddOpen(false)
    setSelectedIngredient('')
    setQuantity('')
    setThreshold('')
    setUnit('g')
  }

  async function handleUpdate(itemId: string) {
    await updateInventory(itemId, {
      quantity_on_hand: Number(quantity),
      threshold_quantity: Number(threshold),
      unit,
    })
    setEditingItem(null)
  }

  function startEdit(item: typeof inventory[0]) {
    setEditingItem(item.id)
    setQuantity(String(item.quantity_on_hand))
    setThreshold(String(item.threshold_quantity))
    setUnit(item.unit)
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading inventory..." />
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
            Inventory
          </h1>
        </div>
        <Button onClick={() => setIsAddOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
          Add Item
        </Button>
      </div>

      <div className="space-y-5">
        {/* Low stock alert tile */}
        {lowStockItems.length > 0 && (
          <div className="flex items-center gap-3 rounded-[22px] bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] p-4 ring-1 ring-honey/30">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-honey/20">
              <AlertTriangle className="h-5 w-5 text-[#A9791B]" />
            </div>
            <div>
              <p className="font-semibold text-[#A9791B]">
                {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} running low
              </p>
              <p className="text-sm text-[#A9791B]/80">
                {lowStockItems.map((item) => item.ingredient?.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Sub-header count */}
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            {inventory.length} item{inventory.length !== 1 ? 's' : ''} tracked
          </p>
        </div>

        {/* Inventory grid */}
        {inventory.length === 0 ? (
          <EmptyState
            icon={<Package className="h-12 w-12" />}
            title="No inventory items"
            description="Start tracking your grocery inventory by adding items"
            action={{
              label: 'Add First Item',
              onClick: () => setIsAddOpen(true),
            }}
          />
        ) : (
          <div className="stagger grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.map((item) => {
              const isLowStock =
                item.threshold_quantity > 0 &&
                item.quantity_on_hand < item.threshold_quantity
              const isEditing = editingItem === item.id
              const stockPct = item.threshold_quantity > 0
                ? Math.min(100, (item.quantity_on_hand / item.threshold_quantity) * 100)
                : null

              return (
                <div
                  key={item.id}
                  className={cn(
                    'rounded-[22px] p-4 ring-1 transition-shadow hover:shadow-soft',
                    isLowStock
                      ? 'bg-gradient-to-br from-honey/[0.14] to-honey/[0.04] ring-honey/30'
                      : 'bg-warm-white ring-latte/60'
                  )}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.ingredient?.emoji}</span>
                        <span className="font-display font-semibold text-espresso">
                          {item.ingredient?.name}
                        </span>
                      </div>
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Threshold"
                        value={threshold}
                        onChange={(e) => setThreshold(e.target.value)}
                      />
                      <Input
                        placeholder="Unit"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(item.id)}
                          className="flex-1"
                          leftIcon={<Check className="h-3.5 w-3.5" />}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(null)}
                          className="flex-1"
                          leftIcon={<X className="h-3.5 w-3.5" />}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald/[0.10] to-emerald/[0.04] text-2xl ring-1 ring-emerald/15">
                            {item.ingredient?.emoji || '📦'}
                          </div>
                          <div>
                            <p className="font-display font-semibold leading-tight text-espresso">
                              {item.ingredient?.name}
                            </p>
                            <p className="metric text-sm text-espresso/60">
                              {item.quantity_on_hand}{' '}
                              <span className="text-xs">{item.unit}</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-espresso/40 hover:text-emerald-dark"
                          onClick={() => startEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {stockPct !== null && (
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between">
                            <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                              Stock level
                            </span>
                            <span className="metric text-xs text-espresso/50">
                              threshold {item.threshold_quantity} {item.unit}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-latte/60">
                            <div
                              className={cn(
                                'h-full rounded-full transition-[width] duration-700 ease-spring',
                                isLowStock
                                  ? 'bg-gradient-to-r from-honey to-[#A9791B]'
                                  : 'bg-gradient-to-r from-[#34D27B] to-emerald'
                              )}
                              style={{ width: `${stockPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <div className="p-6 space-y-4">
          <h2 className="font-display text-title font-semibold text-espresso">
            Add Inventory Item
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

            <Input
              type="number"
              label="Current Quantity"
              placeholder="e.g., 500"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <Input
              label="Unit"
              placeholder="e.g., g, ml, pieces"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />

            <Input
              type="number"
              label="Low Stock Threshold"
              placeholder="Alert when below this amount"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleAdd} className="flex-1">
              Add to Inventory
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
