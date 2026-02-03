import { useState } from 'react'
import { PageContainer } from '@/components/layout'
import { Card, Button, Dialog } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import { useShoppingList } from '@/hooks/useShoppingList'
import { useIngredients } from '@/hooks'
import { ShoppingCart, Plus, Trash2, CheckCircle, Circle, Sparkles } from 'lucide-react'
import type { Ingredient } from '@/types/database'

export function ShoppingList() {
  const { items, isLoading, togglePurchased, removeItem, clearPurchased, addItem } = useShoppingList()
  const { data: ingredients = [] } = useIngredients()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState('')
  const [quantity, setQuantity] = useState('1')

  const purchasedCount = items.filter((item) => item.is_purchased).length
  const pendingItems = items.filter((item) => !item.is_purchased)
  const purchasedItems = items.filter((item) => item.is_purchased)

  // Get ingredients not yet in shopping list
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
      <PageContainer title="Shopping List">
        <LoadingState message="Loading shopping list..." />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Shopping List">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-semibold text-espresso">
              {pendingItems.length} item{pendingItems.length !== 1 ? 's' : ''} to buy
            </h2>
            {purchasedCount > 0 && (
              <p className="text-sm text-espresso/60">
                {purchasedCount} purchased
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {purchasedCount > 0 && (
              <Button variant="outline" onClick={() => clearPurchased()}>
                Clear Purchased
              </Button>
            )}
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Shopping List */}
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
          <div className="space-y-4">
            {/* Pending Items */}
            {pendingItems.length > 0 && (
              <Card className="divide-y divide-latte">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 p-4"
                  >
                    <button
                      onClick={() => togglePurchased(item.id, true)}
                      className="text-espresso/40 hover:text-sage transition-colors"
                    >
                      <Circle className="h-6 w-6" />
                    </button>
                    <div className="flex-1 flex items-center gap-3">
                      <span className="text-2xl">{item.ingredient?.emoji}</span>
                      <div>
                        <p className="font-medium text-espresso">
                          {item.ingredient?.name}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-espresso/60">
                            Qty: {item.quantity_needed}
                          </span>
                          {item.auto_added && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              <Sparkles className="h-3 w-3" />
                              Auto-added
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </Card>
            )}

            {/* Purchased Items */}
            {purchasedItems.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-espresso/60 mb-2">
                  Purchased
                </h3>
                <Card className="divide-y divide-latte bg-sage/5">
                  {purchasedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 p-4 opacity-60"
                    >
                      <button
                        onClick={() => togglePurchased(item.id, false)}
                        className="text-sage hover:text-sage/70 transition-colors"
                      >
                        <CheckCircle className="h-6 w-6" />
                      </button>
                      <div className="flex-1 flex items-center gap-3">
                        <span className="text-2xl">{item.ingredient?.emoji}</span>
                        <p className="font-medium text-espresso line-through">
                          {item.ingredient?.name}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500/60 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Add Item Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <div className="p-6 space-y-4">
            <h2 className="font-heading text-xl font-semibold text-espresso">
              Add to Shopping List
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
              
              <label className="block">
                <span className="text-sm font-medium text-espresso/70">Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full p-2 border border-latte rounded-button bg-white text-espresso"
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
      </div>
    </PageContainer>
  )
}
