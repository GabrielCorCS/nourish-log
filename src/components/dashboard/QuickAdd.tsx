import { useMemo } from 'react'
import { Zap, RotateCcw, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/components/ui'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRecipes, useCreateFoodEntry } from '@/hooks'
import { useUIStore } from '@/stores'
import type { AmountUnit } from '@/lib/nutrition'
import type { FoodEntryWithDetails, MealType, Recipe } from '@/types/database'

function mealTypeByHour(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

// Fast one-tap logging from your recent meals and favorite recipes.
export function QuickAdd() {
  const { user } = useAuth()
  const userId = user?.id
  const addToast = useUIStore((s) => s.addToast)
  const createFoodEntry = useCreateFoodEntry()
  const { data: favorites } = useRecipes(true)

  const { data: recent } = useQuery({
    queryKey: ['recent-meals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_entries')
        .select(
          '*, recipe:recipes(*), food_entry_ingredients(*, ingredient:ingredients(*))'
        )
        .eq('user_id', userId!)
        .order('logged_at', { ascending: false })
        .limit(12)
      if (error) throw error
      return data as FoodEntryWithDetails[]
    },
  })

  const recentUnique = useMemo(() => {
    const seen = new Set<string>()
    const out: FoodEntryWithDetails[] = []
    for (const e of recent ?? []) {
      const key = e.recipe_id || e.notes || e.id
      if (seen.has(key)) continue
      seen.add(key)
      out.push(e)
      if (out.length >= 4) break
    }
    return out
  }, [recent])

  const logRecipe = async (recipe: Recipe) => {
    const perServing = {
      calories: recipe.total_calories / recipe.servings,
      protein: recipe.total_protein / recipe.servings,
      carbs: recipe.total_carbs / recipe.servings,
      fat: recipe.total_fat / recipe.servings,
    }
    try {
      await createFoodEntry.mutateAsync({
        entry: {
          recipe_id: recipe.id,
          meal_type: mealTypeByHour(),
          servings: 1,
          calories: perServing.calories,
          protein: perServing.protein,
          carbs: perServing.carbs,
          fat: perServing.fat,
          notes: null,
        },
      })
      addToast(`Logged ${recipe.name}`, 'success')
    } catch {
      addToast('Failed to log', 'error')
    }
  }

  const relog = async (e: FoodEntryWithDetails) => {
    try {
      await createFoodEntry.mutateAsync({
        entry: {
          recipe_id: e.recipe_id,
          meal_type: mealTypeByHour(),
          servings: e.servings,
          calories: e.calories,
          protein: e.protein,
          carbs: e.carbs,
          fat: e.fat,
          notes: e.notes,
        },
        ingredients: (e.food_entry_ingredients ?? []).map((fi) => ({
          ingredientId: fi.ingredient_id,
          amount: fi.amount ?? fi.quantity,
          unit: (fi.unit as AmountUnit) ?? 'serving',
          quantity: fi.quantity,
        })),
      })
      addToast('Re-logged', 'success')
    } catch {
      addToast('Failed to re-log', 'error')
    }
  }

  const hasFavorites = (favorites?.length ?? 0) > 0
  const hasRecent = recentUnique.length > 0
  if (!hasFavorites && !hasRecent) return null

  return (
    <Card variant="elevated" padding="lg">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-caramel" />
        <h2 className="font-heading text-lg font-bold text-espresso">Quick add</h2>
      </div>

      {hasRecent && (
        <div className="mb-4">
          <p className="text-xs font-medium text-espresso/50 mb-2 flex items-center gap-1">
            <RotateCcw className="h-3 w-3" /> Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recentUnique.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => relog(e)}
                disabled={createFoodEntry.isPending}
                className="rounded-button border border-latte bg-warm-white px-3 py-1.5 text-sm text-espresso hover:bg-latte/30 transition-colors disabled:opacity-50"
              >
                {e.recipe?.emoji || '🍽️'} {e.recipe?.name || 'Quick add'} ·{' '}
                {Math.round(e.calories)} cal
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFavorites && (
        <div>
          <p className="text-xs font-medium text-espresso/50 mb-2 flex items-center gap-1">
            <Star className="h-3 w-3" /> Favorites
          </p>
          <div className="flex flex-wrap gap-2">
            {favorites!.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => logRecipe(r)}
                disabled={createFoodEntry.isPending}
                className="rounded-button border border-latte bg-warm-white px-3 py-1.5 text-sm text-espresso hover:bg-latte/30 transition-colors disabled:opacity-50"
              >
                {r.emoji || '🍽️'} {r.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
