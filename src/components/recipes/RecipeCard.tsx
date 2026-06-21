import { Heart, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'
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
    <div
      className="pressable masonry-item cursor-pointer overflow-hidden rounded-[28px] bg-warm-white ring-1 ring-latte/60 transition-shadow hover:shadow-soft-lg"
      onClick={() => navigate(`/recipes/${recipe.id}`)}
    >
      {/* Emoji avatar strip */}
      <div className="relative flex items-center justify-between overflow-hidden rounded-t-[28px] bg-gradient-to-br from-emerald/[0.10] to-emerald/[0.04] px-5 pb-4 pt-5">
        {/* Ambient blob */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-50 blur-2xl"
          style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.35), transparent 70%)' }}
        />
        <span className="relative text-4xl leading-none">{recipe.emoji || '🍽️'}</span>
        <Button
          variant="ghost"
          size="icon"
          className="relative z-10 h-9 w-9 flex-shrink-0 rounded-full bg-white/70 ring-1 ring-latte/60 backdrop-blur-sm"
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

      {/* Content */}
      <div className="px-5 pb-5 pt-3">
        <h3 className="font-display text-lg font-semibold leading-snug text-espresso line-clamp-1">
          {recipe.name}
        </h3>

        {recipe.description && (
          <p className="mt-1 text-sm text-espresso/55 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Per-serving calorie metric */}
        <div className="metric mt-3 flex items-baseline gap-1.5">
          <span className="text-3xl font-bold leading-none text-espresso">
            {Math.round(perServing.calories)}
          </span>
          <span className="text-sm font-medium text-espresso/45">kcal / serving</span>
        </div>

        {/* Macro pills */}
        <MacroPills
          calories={perServing.calories}
          protein={perServing.protein}
          carbs={perServing.carbs}
          fat={perServing.fat}
          hideCalories
          className="mt-2.5"
        />

        {/* Footer row */}
        <div className="mt-3 flex items-center gap-3 text-xs text-espresso/45">
          <span className="font-medium">{recipe.servings} servings</span>
          {totalTime > 0 && (
            <>
              <span className="h-1 w-1 rounded-full bg-espresso/25" />
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {totalTime} min
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
