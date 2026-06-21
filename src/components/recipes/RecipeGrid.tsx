import { ChefHat } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/shared'
import { RecipeCard } from './RecipeCard'
import { useRecipes } from '@/hooks'
import { useFilterStore } from '@/stores'

function MasonrySkeleton() {
  return (
    <div className="masonry-grid">
      {[180, 220, 160, 200, 170, 240].map((h, i) => (
        <div
          key={i}
          className="masonry-item skeleton rounded-[28px]"
          style={{ height: h }}
        />
      ))}
    </div>
  )
}

export function RecipeGrid() {
  const navigate = useNavigate()
  const { recipeSearch, recipeFavoritesOnly } = useFilterStore()
  const { data: recipes, isLoading } = useRecipes(recipeFavoritesOnly)

  const filteredRecipes = recipes?.filter((recipe) =>
    recipe.name.toLowerCase().includes(recipeSearch.toLowerCase())
  )

  if (isLoading) {
    return <MasonrySkeleton />
  }

  if (!filteredRecipes || filteredRecipes.length === 0) {
    return (
      <div className="rounded-[28px] bg-warm-white p-6 ring-1 ring-latte/60">
        <EmptyState
          icon={<ChefHat className="h-8 w-8" />}
          title={recipeFavoritesOnly ? 'No favorite recipes' : 'No recipes yet'}
          description={
            recipeFavoritesOnly
              ? 'Heart a recipe to add it to your favorites'
              : 'Create your first recipe to start tracking meals'
          }
          action={
            !recipeFavoritesOnly
              ? {
                  label: 'Create Recipe',
                  onClick: () => navigate('/recipes/new'),
                }
              : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="masonry-grid stagger">
      {filteredRecipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
