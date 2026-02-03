import { useState } from 'react'
import { PageContainer } from '@/components/layout'
import { Card, Button, Input, Dialog } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import { useInventory } from '@/hooks/useInventory'
import { useIngredients } from '@/hooks'
import { Package, Plus, AlertTriangle, Edit2 } from 'lucide-react'
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

  // Get ingredients not yet in inventory for adding
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
      <PageContainer title="Inventory">
        <LoadingState message="Loading inventory..." />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Inventory">
      <div className="space-y-6">
        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">
                  {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low on stock
                </p>
                <p className="text-sm text-amber-600">
                  {lowStockItems.map((item) => item.ingredient?.name).join(', ')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-espresso">
            Your Inventory ({inventory.length})
          </h2>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Inventory Grid */}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {inventory.map((item) => {
              const isLowStock =
                item.threshold_quantity > 0 &&
                item.quantity_on_hand < item.threshold_quantity
              const isEditing = editingItem === item.id

              return (
                <Card
                  key={item.id}
                  className={cn(
                    'p-4',
                    isLowStock && 'border-amber-300 bg-amber-50/50'
                  )}
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{item.ingredient?.emoji}</span>
                        <span className="font-medium text-espresso">
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
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(null)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{item.ingredient?.emoji}</span>
                          <div>
                            <p className="font-medium text-espresso">
                              {item.ingredient?.name}
                            </p>
                            <p className="text-sm text-espresso/60">
                              {item.quantity_on_hand} {item.unit}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => startEdit(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.threshold_quantity > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-espresso/60 mb-1">
                            <span>Stock level</span>
                            <span>Threshold: {item.threshold_quantity} {item.unit}</span>
                          </div>
                          <div className="h-2 bg-latte rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                isLowStock ? 'bg-amber-500' : 'bg-sage'
                              )}
                              style={{
                                width: `${Math.min(
                                  100,
                                  (item.quantity_on_hand / item.threshold_quantity) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </Card>
              )
            })}
          </div>
        )}

        {/* Add Item Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <div className="p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-espresso">
              Add Inventory Item
            </h2>
            
            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium text-espresso/70">Ingredient</span>
                <select
                  value={selectedIngredient}
                  onChange={(e) => setSelectedIngredient(e.target.value)}
                  className="mt-1 w-full p-2 border border-latte rounded-button bg-white text-espresso"
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
      </div>
    </PageContainer>
  )
}
