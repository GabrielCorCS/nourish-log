import { Heart, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, Button } from '@/components/ui'
import { MacroPills } from '@/components/shared'
import { useToggleFavorite } from '@/hooks'
import { cn } from '@/lib/utils'
import type { Recipe } from '@/types/database'

interface RecipeCardProps {
  recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate()
  const toggleFavorite = useToggleFavorite()

  const perServing = {
    calories: recipe.total_calories / recipe.servings,
    protein: recipe.total_protein / recipe.servings,
    carbs: recipe.total_carbs / recipe.servings,
    fat: recipe.total_fat / recipe.servings,
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite.mutate({
      id: recipe.id,
      isFavorite: !recipe.is_favorite,
    })
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

  return (
    <Card
      variant="elevated"
      padding="none"
      hoverable
      className="overflow-hidden animate-fade-in cursor-pointer masonry-item"
      onClick={() => navigate(`/recipes/${recipe.id}`)}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{recipe.emoji || '🍽️'}</span>
            <div>
              <h3 className="font-heading font-semibold text-espresso line-clamp-1">
                {recipe.name}
              </h3>
              <p className="text-xs text-espresso/50">
                {recipe.servings} servings
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={handleFavoriteClick}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                recipe.is_favorite
                  ? 'fill-terracotta text-terracotta'
                  : 'text-espresso/40'
              )}
            />
          </Button>
        </div>

        {recipe.description && (
          <p className="text-sm text-espresso/60 line-clamp-2 mb-3">
            {recipe.description}
          </p>
        )}

        <MacroPills
          calories={perServing.calories}
          protein={perServing.protein}
          carbs={perServing.carbs}
          fat={perServing.fat}
        />

        {totalTime > 0 && (
          <div className="flex items-center gap-1 mt-3 text-xs text-espresso/50">
            <Clock className="h-3 w-3" />
            <span>{totalTime} min</span>
          </div>
        )}
      </div>
    </Card>
  )
}
