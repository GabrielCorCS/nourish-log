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
        placeholder="Search recipes…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        leftIcon={<Search className="h-4 w-4" />}
      />

      <div className="max-h-[320px] overflow-y-auto space-y-2 pr-0.5">
        {!filteredRecipes || filteredRecipes.length === 0 ? (
          <EmptyState
            icon={<ChefHat className="h-6 w-6" />}
            title="No recipes found"
            description={search ? 'Try a different search term' : 'Create some recipes first'}
          />
        ) : (
          <ul className="stagger space-y-2">
            {filteredRecipes.map((recipe) => {
              const perServing = {
                calories: recipe.total_calories / recipe.servings,
                protein: recipe.total_protein / recipe.servings,
                carbs: recipe.total_carbs / recipe.servings,
                fat: recipe.total_fat / recipe.servings,
              }

              return (
                <li key={recipe.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(recipe)}
                    className={cn(
                      'pressable w-full flex items-start gap-3 rounded-[22px] p-3.5 text-left',
                      'bg-gradient-to-br from-emerald/[0.07] to-emerald/[0.02] ring-1 ring-emerald/12',
                      'transition-all duration-200',
                      'hover:ring-emerald/35 hover:from-emerald/[0.12]',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald'
                    )}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-warm-white text-2xl shadow-soft ring-1 ring-latte/60">
                      {recipe.emoji || '🍽️'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-espresso truncate">
                        {recipe.name}
                      </p>
                      <p className="metric text-xs text-espresso/45 mb-2">
                        {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
                      </p>
                      <MacroPills
                        calories={perServing.calories}
                        protein={perServing.protein}
                        carbs={perServing.carbs}
                        fat={perServing.fat}
                      />
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
