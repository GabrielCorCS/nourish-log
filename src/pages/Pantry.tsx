import { useState } from 'react'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui'
import { CategoryTabs, IngredientList, PurchaseForm } from '@/components/pantry'
import { StoreList } from '@/components/stores'
import { SpendingOverview } from '@/components/spending'
import { DollarSign, ShoppingBag, Store } from 'lucide-react'
import { cn } from '@/lib/utils'

type PantryTab = 'ingredients' | 'stores' | 'spending'

const TABS: { value: PantryTab; label: string; icon: React.ReactNode }[] = [
  { value: 'ingredients', label: 'Ingredients', icon: <ShoppingBag className="h-4 w-4" /> },
  { value: 'stores', label: 'Stores', icon: <Store className="h-4 w-4" /> },
  { value: 'spending', label: 'Spending', icon: <DollarSign className="h-4 w-4" /> },
]

export function Pantry() {
  const [activeTab, setActiveTab] = useState<PantryTab>('ingredients')
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)

  return (
    <PageContainer>
      {/* Page header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            Groceries
          </p>
          <h1 className="font-display text-display font-semibold text-espresso">
            Pantry
          </h1>
        </div>
        {activeTab === 'spending' && (
          <Button onClick={() => setShowPurchaseForm(true)} leftIcon={<DollarSign className="h-4 w-4" />}>
            Log Purchase
          </Button>
        )}
      </div>

      {/* Pill tab strip */}
      <div className="mb-6 flex gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'pressable flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors',
              activeTab === tab.value
                ? 'bg-gradient-to-r from-emerald to-emerald-dark text-white shadow-soft'
                : 'bg-warm-white text-espresso/70 ring-1 ring-latte hover:bg-cream hover:text-espresso'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          {/* Category chip rail */}
          <div className="rounded-[22px] bg-warm-white p-4 ring-1 ring-latte/60">
            <CategoryTabs />
          </div>
          <IngredientList />
        </div>
      )}

      {activeTab === 'stores' && <StoreList />}

      {activeTab === 'spending' && <SpendingOverview />}

      {showPurchaseForm && (
        <PurchaseForm onClose={() => setShowPurchaseForm(false)} />
      )}
    </PageContainer>
  )
}
