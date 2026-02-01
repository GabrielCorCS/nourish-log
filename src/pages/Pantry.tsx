import { PageContainer } from '@/components/layout'
import { Card } from '@/components/ui'
import { CategoryTabs, IngredientList } from '@/components/pantry'

export function Pantry() {
  return (
    <PageContainer
      title="Pantry"
      description="Manage your ingredients"
    >
      <div className="space-y-6">
        <Card variant="elevated" padding="md">
          <CategoryTabs />
        </Card>

        <IngredientList />
      </div>
    </PageContainer>
  )
}
