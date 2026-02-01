import { Tabs, TabsList, TabsTrigger } from '@/components/ui'
import { INGREDIENT_CATEGORIES } from '@/lib/constants'
import { useFilterStore } from '@/stores'
import type { IngredientCategory } from '@/types/database'

export function CategoryTabs() {
  const { pantryCategory, setPantryCategory } = useFilterStore()

  return (
    <Tabs
      value={pantryCategory}
      onValueChange={(value) => setPantryCategory(value as IngredientCategory | 'all')}
    >
      <TabsList className="flex-wrap justify-start">
        <TabsTrigger value="all">All</TabsTrigger>
        {INGREDIENT_CATEGORIES.map((category) => (
          <TabsTrigger key={category.value} value={category.value}>
            {category.emoji} {category.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
