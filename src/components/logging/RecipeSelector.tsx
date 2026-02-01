import { useState } from 'react'
import { Search, ChefHat } from 'lucide-react'
import { Input } from '@/components/ui'
import { MacroPills, EmptyState, ListSkeleton } from '@/components/shared'
import { useRecipes } from '@/hooks'
import { useLogMealStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { Recipe } from '@/types/database'

export function RecipeSelector() {
  const [search, setSearch] = useState('')
  const { data: recipes, isLoading } = useRecipes()
  const setSelectedRecipe = useLogMealStore((state) => state.setSelectedRecipe)

  const filteredRecipes = recipes?.filter((recipe) =>
    recipe.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe)
  }

  if (isLoading) {
    return <ListSkeleton count={4} />
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search recipes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />

      <div className="max-h-[300px] overflow-y-auto space-y-2">
        {!filteredRecipes || filteredRecipes.length === 0 ? (
          <EmptyState
            icon={<ChefHat className="h-6 w-6" />}
            title="No recipes found"
            description={
              search
                ? 'Try a different search term'
                : 'Create some recipes first'
            }
          />
        ) : (
          filteredRecipes.map((recipe) => {
            const perServing = {
              calories: recipe.total_calories / recipe.servings,
              protein: recipe.total_protein / recipe.servings,
              carbs: recipe.total_carbs / recipe.servings,
              fat: recipe.total_fat / recipe.servings,
            }

            return (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe)}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-card',
                  'bg-cream border-2 border-transparent',
                  'hover:border-caramel hover:bg-caramel/5',
                  'transition-all duration-200 text-left',
                  'focus:outline-none focus:ring-2 focus:ring-caramel'
                )}
              >
                <span className="text-2xl flex-shrink-0">
                  {recipe.emoji || '🍽️'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-espresso truncate">
                    {recipe.name}
                  </p>
                  <p className="text-xs text-espresso/50 mb-2">
                    {recipe.servings} servings
                  </p>
                  <MacroPills
                    calories={perServing.calories}
                    protein={perServing.protein}
                    carbs={perServing.carbs}
                    fat={perServing.fat}
                  />
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
