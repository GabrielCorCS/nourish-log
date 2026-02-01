import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Heart, Clock, Users } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button, Card, Badge } from '@/components/ui'
import { MacroDisplay, LoadingState, EmptyState } from '@/components/shared'
import { useRecipe, useDeleteRecipe, useToggleFavorite } from '@/hooks'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const { data: recipe, isLoading } = useRecipe(id || '')
  const deleteRecipe = useDeleteRecipe()
  const toggleFavorite = useToggleFavorite()

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading recipe..." />
      </PageContainer>
    )
  }

  if (!recipe) {
    return (
      <PageContainer>
        <EmptyState
          title="Recipe not found"
          description="This recipe may have been deleted"
          action={{ label: 'Back to Recipes', onClick: () => navigate('/recipes') }}
        />
      </PageContainer>
    )
  }

  const handleDelete = async () => {
    if (confirm(`Delete "${recipe.name}"?`)) {
      try {
        await deleteRecipe.mutateAsync(recipe.id)
        addToast('Recipe deleted', 'success')
        navigate('/recipes')
      } catch {
        addToast('Failed to delete recipe', 'error')
      }
    }
  }

  const handleToggleFavorite = () => {
    toggleFavorite.mutate({
      id: recipe.id,
      isFavorite: !recipe.is_favorite,
    })
  }

  const perServing = {
    calories: recipe.total_calories / recipe.servings,
    protein: recipe.total_protein / recipe.servings,
    carbs: recipe.total_carbs / recipe.servings,
    fat: recipe.total_fat / recipe.servings,
  }

  const totalTime = (recipe.prep_time || 0) + (recipe.cook_time || 0)

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/recipes')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{recipe.emoji || '🍽️'}</span>
              <div>
                <h1 className="font-heading text-2xl font-bold text-espresso">
                  {recipe.name}
                </h1>
                {recipe.description && (
                  <p className="text-sm text-espresso/60 mt-1">
                    {recipe.description}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleFavorite}
            >
              <Heart
                className={cn(
                  'h-5 w-5',
                  recipe.is_favorite
                    ? 'fill-terracotta text-terracotta'
                    : 'text-espresso/40'
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
            >
              <Edit2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-terracotta"
              onClick={handleDelete}
            >
              <Trash2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex flex-wrap gap-3">
          <Badge variant="secondary">
            <Users className="h-3 w-3 mr-1" />
            {recipe.servings} servings
          </Badge>
          {totalTime > 0 && (
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {totalTime} min
            </Badge>
          )}
        </div>

        {/* Nutrition */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
            Nutrition per Serving
          </h2>
          <MacroDisplay
            calories={perServing.calories}
            protein={perServing.protein}
            carbs={perServing.carbs}
            fat={perServing.fat}
            layout="grid"
            size="lg"
          />
        </Card>

        {/* Ingredients */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
            Ingredients
          </h2>
          <div className="space-y-2">
            {recipe.recipe_ingredients.map((ri) => (
              <div
                key={ri.id}
                className="flex items-center gap-3 p-2 bg-cream rounded-input"
              >
                <span>{ri.ingredient.emoji || '🍽️'}</span>
                <span className="flex-1 text-espresso">
                  {ri.ingredient.name}
                </span>
                <span className="text-sm text-espresso/50">
                  {ri.quantity} x {ri.ingredient.serving_size}{' '}
                  {ri.ingredient.serving_unit}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Instructions */}
        {recipe.instructions && (
          <Card variant="elevated" padding="lg">
            <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
              Instructions
            </h2>
            <p className="text-espresso whitespace-pre-wrap">
              {recipe.instructions}
            </p>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
