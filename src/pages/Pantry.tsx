import { useState } from 'react'
import { PageContainer } from '@/components/layout'
import { Card, Tabs, TabsList, TabsTrigger, Button } from '@/components/ui'
import { CategoryTabs, IngredientList, PurchaseForm } from '@/components/pantry'
import { StoreList } from '@/components/stores'
import { SpendingOverview } from '@/components/spending'
import { DollarSign } from 'lucide-react'

type PantryTab = 'ingredients' | 'stores' | 'spending'

export function Pantry() {
  const [activeTab, setActiveTab] = useState<PantryTab>('ingredients')
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)

  return (
    <PageContainer
      title="Pantry"
      description="Manage ingredients, stores, and track spending"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as PantryTab)}>
            <TabsList>
              <TabsTrigger value="ingredients">🥕 Ingredients</TabsTrigger>
              <TabsTrigger value="stores">🏪 Stores</TabsTrigger>
              <TabsTrigger value="spending">💰 Spending</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {activeTab === 'spending' && (
            <Button size="sm" onClick={() => setShowPurchaseForm(true)}>
              <DollarSign className="h-4 w-4 mr-1" />
              Log Purchase
            </Button>
          )}
        </div>

        {activeTab === 'ingredients' && (
          <>
            <Card variant="elevated" padding="md">
              <CategoryTabs />
            </Card>
            <IngredientList />
          </>
        )}

        {activeTab === 'stores' && <StoreList />}

        {activeTab === 'spending' && <SpendingOverview />}

        {showPurchaseForm && (
          <PurchaseForm onClose={() => setShowPurchaseForm(false)} />
        )}
      </div>
    </PageContainer>
  )
}
