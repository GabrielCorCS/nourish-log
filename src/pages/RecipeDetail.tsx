import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Heart, Clock, Users } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui'
import { LoadingState, EmptyState } from '@/components/shared'
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
        <div className="rounded-[28px] bg-warm-white p-6 ring-1 ring-latte/60">
          <LoadingState message="Loading recipe…" />
        </div>
      </PageContainer>
    )
  }

  if (!recipe) {
    return (
      <PageContainer>
        <div className="rounded-[28px] bg-warm-white p-6 ring-1 ring-latte/60">
          <EmptyState
            title="Recipe not found"
            description="This recipe may have been deleted"
            action={{ label: 'Back to Recipes', onClick: () => navigate('/recipes') }}
          />
        </div>
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
      <div className="space-y-4">
        {/* ── Editorial hero tile ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-6 text-white">
          {/* Ambient glows */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-55 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.4), transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-8 h-48 w-48 rounded-full opacity-35 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.35), transparent 70%)' }}
          />

          {/* Nav row */}
          <div className="relative mb-5 flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/recipes')}
              className="h-9 w-9 rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleToggleFavorite}
                className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label={recipe.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-colors',
                    recipe.is_favorite ? 'fill-terracotta text-terracotta' : 'text-white/70'
                  )}
                />
              </button>
              <button
                type="button"
                onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                aria-label="Edit recipe"
              >
                <Edit2 className="h-4 w-4 text-white/70" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="pressable flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-terracotta/30"
                aria-label="Delete recipe"
              >
                <Trash2 className="h-4 w-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Emoji + name */}
          <div className="relative flex items-start gap-4">
            <span className="text-5xl leading-none">{recipe.emoji || '🍽️'}</span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-title font-semibold leading-tight text-white sm:text-[2rem]">
                {recipe.name}
              </h1>
              {recipe.description && (
                <p className="mt-1.5 text-sm text-white/60 line-clamp-2">{recipe.description}</p>
              )}
            </div>
          </div>

          {/* Time + servings badges */}
          <div className="relative mt-5 flex flex-wrap items-center gap-2">
            <span className="metric flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
              <Users className="h-3.5 w-3.5 text-lime/80" />
              {recipe.servings} {recipe.servings === 1 ? 'serving' : 'servings'}
            </span>
            {totalTime > 0 && (
              <span className="metric flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85 ring-1 ring-white/15">
                <Clock className="h-3.5 w-3.5 text-lime/80" />
                {totalTime} min
              </span>
            )}
          </div>
        </div>

        {/* ── Per-serving macro stat tiles ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Calories — accent pop tile */}
          <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-citrus to-terracotta p-4 text-white">
            <span className="text-xs font-bold uppercase tracking-wide text-white/80">
              Calories
            </span>
            <div className="metric mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none">
                {Math.round(perServing.calories)}
              </span>
              <span className="text-xs font-medium text-white/70">kcal</span>
            </div>
          </div>

          {/* Protein */}
          <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] p-4 ring-1 ring-emerald/20">
            <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
              Protein
            </span>
            <div className="metric mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none text-espresso">
                {Math.round(perServing.protein)}
              </span>
              <span className="text-xs font-medium text-espresso/45">g</span>
            </div>
          </div>

          {/* Carbs */}
          <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] p-4 ring-1 ring-honey/30">
            <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
              Carbs
            </span>
            <div className="metric mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none text-espresso">
                {Math.round(perServing.carbs)}
              </span>
              <span className="text-xs font-medium text-espresso/45">g</span>
            </div>
          </div>

          {/* Fat */}
          <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-blush/[0.16] to-blush/[0.05] p-4 ring-1 ring-blush/25">
            <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
              Fat
            </span>
            <div className="metric mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold leading-none text-espresso">
                {Math.round(perServing.fat)}
              </span>
              <span className="text-xs font-medium text-espresso/45">g</span>
            </div>
          </div>
        </div>

        {/* ── Ingredients tile ───────────────────────────────────────── */}
        <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
          <h2 className="font-display text-xl font-semibold text-espresso mb-4">
            Ingredients
          </h2>
          <div className="space-y-2">
            {recipe.recipe_ingredients.map((ri) => (
              <div
                key={ri.id}
                className="flex items-center gap-3 rounded-[14px] bg-cream p-3"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-warm-white text-lg shadow-soft">
                  {ri.ingredient.emoji || '🍽️'}
                </span>
                <span className="flex-1 text-sm font-medium text-espresso">
                  {ri.ingredient.name}
                </span>
                <span className="metric shrink-0 text-xs font-semibold text-espresso/50">
                  {ri.quantity} × {ri.ingredient.serving_size}{' '}
                  {ri.ingredient.serving_unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Instructions tile ──────────────────────────────────────── */}
        {recipe.instructions && (
          <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
            <h2 className="font-display text-xl font-semibold text-espresso mb-4">
              Instructions
            </h2>
            <p className="text-sm leading-relaxed text-espresso whitespace-pre-wrap">
              {recipe.instructions}
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  )
}
