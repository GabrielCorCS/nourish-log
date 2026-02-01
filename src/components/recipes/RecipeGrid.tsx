import { ChefHat } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, ListSkeleton } from '@/components/shared'
import { RecipeCard } from './RecipeCard'
import { useRecipes } from '@/hooks'
import { useFilterStore } from '@/stores'

export function RecipeGrid() {
  const navigate = useNavigate()
  const { recipeSearch, recipeFavoritesOnly } = useFilterStore()
  const { data: recipes, isLoading } = useRecipes(recipeFavoritesOnly)

  const filteredRecipes = recipes?.filter((recipe) =>
    recipe.name.toLowerCase().includes(recipeSearch.toLowerCase())
  )

  if (isLoading) {
    return <ListSkeleton count={6} />
  }

  if (!filteredRecipes || filteredRecipes.length === 0) {
    return (
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
    )
  }

  return (
    <div className="masonry-grid">
      {filteredRecipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  )
}
