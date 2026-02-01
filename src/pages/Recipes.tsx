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
    <PageContainer
      title="Recipes"
      description="Your saved recipes"
      action={
        <Button
          onClick={() => navigate('/recipes/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Recipe
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="Search recipes..."
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button
            variant={recipeFavoritesOnly ? 'primary' : 'outline'}
            size="icon"
            onClick={() => setRecipeFavoritesOnly(!recipeFavoritesOnly)}
            className="flex-shrink-0"
          >
            <Heart
              className={cn(
                'h-4 w-4',
                recipeFavoritesOnly && 'fill-current'
              )}
            />
          </Button>
        </div>

        <RecipeGrid />
      </div>
    </PageContainer>
  )
}
