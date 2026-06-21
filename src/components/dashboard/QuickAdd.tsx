import { useMemo } from 'react'
import { Zap, RotateCcw, Star } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
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
    <div className="col-span-2 h-full rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/12 text-emerald-dark">
          <Zap className="h-4 w-4" />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold leading-none text-espresso">Quick add</h2>
          <p className="mt-1 text-xs text-espresso/45">One tap to log</p>
        </div>
      </div>

      {hasRecent && (
        <div className="mb-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-espresso/40">
            <RotateCcw className="h-3 w-3" /> Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recentUnique.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => relog(e)}
                disabled={createFoodEntry.isPending}
                className="pressable group flex items-center gap-2 rounded-full border border-latte bg-warm-white py-1.5 pl-1.5 pr-3.5 text-sm text-espresso hover:border-emerald/40 hover:bg-emerald/[0.04] disabled:opacity-50"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-cream text-base">
                  {e.recipe?.emoji || '🍽️'}
                </span>
                <span className="font-medium">{e.recipe?.name || 'Quick add'}</span>
                <span className="metric text-xs text-espresso/45">{Math.round(e.calories)} cal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasFavorites && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-espresso/40">
            <Star className="h-3 w-3" /> Favorites
          </p>
          <div className="flex flex-wrap gap-2">
            {favorites!.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => logRecipe(r)}
                disabled={createFoodEntry.isPending}
                className="pressable flex items-center gap-2 rounded-full border border-latte bg-warm-white py-1.5 pl-1.5 pr-3.5 text-sm text-espresso hover:border-emerald/40 hover:bg-emerald/[0.04] disabled:opacity-50"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-cream text-base">
                  {r.emoji || '🍽️'}
                </span>
                <span className="font-medium">{r.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
