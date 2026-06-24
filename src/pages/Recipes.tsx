import { Plus, Search, Heart } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout'
import { Button, Input } from '@/components/ui'
import { RecipeGrid } from '@/components/recipes'
import { useFilterStore } from '@/stores'
import { cn } from '@/lib/utils'

export function Recipes() {
  const navigate = useNavigate()
  const {
    recipeSearch,
    setRecipeSearch,
    recipeFavoritesOnly,
    setRecipeFavoritesOnly,
  } = useFilterStore()

  return (
    <PageContainer>
      {/* Bold editorial header */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">
            Your kitchen
          </p>
          <h1 className="font-display text-display font-semibold text-espresso">
            Recipes
          </h1>
        </div>
        <Button
          variant="accent"
          onClick={() => navigate('/recipes/new')}
          leftIcon={<Plus className="h-4 w-4" />}
          className="shrink-0"
        >
          New Recipe
        </Button>
      </div>

      {/* Search + filter bar — light tile */}
      <div className="mb-6 flex gap-2 rounded-[22px] bg-warm-white p-3 ring-1 ring-latte/60">
        <div className="flex-1">
          <Input
            placeholder="Search recipes…"
            value={recipeSearch}
            onChange={(e) => setRecipeSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <button
          type="button"
          onClick={() => setRecipeFavoritesOnly(!recipeFavoritesOnly)}
          className={cn(
            'pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ring-1 transition-colors',
            recipeFavoritesOnly
              ? 'bg-gradient-to-b from-terracotta to-[#c45512] text-white ring-transparent shadow-glow'
              : 'bg-cream text-espresso/50 ring-latte/60 hover:text-terracotta'
          )}
          aria-label={recipeFavoritesOnly ? 'Show all recipes' : 'Show favorites only'}
        >
          <Heart
            className={cn('h-4 w-4 transition-all', recipeFavoritesOnly && 'fill-current')}
          />
        </button>
      </div>

      <RecipeGrid />
    </PageContainer>
  )
}
