import { useMemo } from 'react'
import { ScanLine, ChefHat, Carrot, RotateCcw, Star, ChevronRight, Sparkles } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useRecipes, useCreateFoodEntry } from '@/hooks'
import { useLogMealStore, useUIStore } from '@/stores'
import { MEAL_TYPES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { AmountUnit } from '@/lib/nutrition'
import type { FoodEntryWithDetails, Recipe } from '@/types/database'

/** The log sheet's home screen: pick meal (pre-filled), then the fastest path. */
export function LogHub() {
  const { user } = useAuth()
  const userId = user?.id
  const { mealType, setMealType, setSource, setStep, subjectUserId } = useLogMealStore()
  const { closeLogMealModal, addToast } = useUIStore()
  const createFoodEntry = useCreateFoodEntry()
  const { data: favorites } = useRecipes(true)

  const { data: recent } = useQuery({
    queryKey: ['recent-meals', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('food_entries')
        .select('*, recipe:recipes(*), food_entry_ingredients(*, ingredient:ingredients(*))')
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
      if (out.length >= 6) break
    }
    return out
  }, [recent])

  const done = (label: string) => {
    addToast(`Logged ${label}`, 'success')
    closeLogMealModal()
  }

  const logRecipe = async (recipe: Recipe) => {
    try {
      await createFoodEntry.mutateAsync({
        entry: {
          recipe_id: recipe.id,
          meal_type: mealType,
          servings: 1,
          calories: recipe.total_calories / recipe.servings,
          protein: recipe.total_protein / recipe.servings,
          carbs: recipe.total_carbs / recipe.servings,
          fat: recipe.total_fat / recipe.servings,
          notes: null,
        },
        subjectUserId: subjectUserId ?? undefined,
      })
      done(recipe.name)
    } catch {
      addToast('Failed to log', 'error')
    }
  }

  const relog = async (e: FoodEntryWithDetails) => {
    try {
      await createFoodEntry.mutateAsync({
        entry: {
          recipe_id: e.recipe_id,
          meal_type: mealType,
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
        subjectUserId: subjectUserId ?? undefined,
      })
      done(e.recipe?.name || 'meal')
    } catch {
      addToast('Failed to log', 'error')
    }
  }

  const entryLabel = (e: FoodEntryWithDetails) =>
    e.recipe?.name || e.notes?.split(' (')[0] || 'Quick add'

  return (
    <div className="space-y-5">
      {/* Meal type — pre-selected by time, one tap to change */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">Meal</p>
        <div className="flex gap-2">
          {MEAL_TYPES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMealType(m.value)}
              className={cn(
                'pressable flex flex-1 flex-col items-center gap-1 rounded-[16px] py-2.5 ring-1 transition-colors',
                mealType === m.value
                  ? 'bg-emerald/12 ring-emerald/30'
                  : 'bg-warm-white ring-latte/60 hover:ring-emerald/30'
              )}
            >
              <span className="text-lg">{m.emoji}</span>
              <span
                className={cn(
                  'text-[11px] font-semibold',
                  mealType === m.value ? 'text-emerald-dark' : 'text-espresso/55'
                )}
              >
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Hero: Scan barcode */}
      <button
        type="button"
        onClick={() => setStep('scan')}
        className="pressable relative flex w-full items-center gap-4 overflow-hidden rounded-[24px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-5 text-left text-white"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.45), transparent 70%)' }}
        />
        <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20">
          <ScanLine className="h-6 w-6 text-lime" />
        </span>
        <div className="relative flex-1">
          <p className="font-display text-lg font-semibold">Scan a barcode</p>
          <p className="text-sm text-white/65">Instant nutrition from the packet</p>
        </div>
        <ChevronRight className="relative h-5 w-5 text-white/50" />
      </button>

      {/* Describe with AI — type a sentence, Claude estimates the macros */}
      <button
        type="button"
        onClick={() => setStep('ai')}
        className="pressable flex w-full items-center gap-3 rounded-[20px] bg-gradient-to-br from-honey/[0.20] to-honey/[0.07] p-4 text-left ring-1 ring-honey/30"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-warm-white text-[#A9791B] shadow-soft">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-display font-semibold text-espresso">Describe with AI</p>
          <p className="text-sm text-espresso/55">“2 eggs, toast & a banana” → macros</p>
        </div>
        <ChevronRight className="h-5 w-5 text-espresso/35" />
      </button>

      {/* Other methods */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setSource('recipe')}
          className="pressable flex flex-col items-start gap-2 rounded-[20px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] p-4 text-left ring-1 ring-emerald/20"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-warm-white text-emerald-dark shadow-soft">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="font-display font-semibold text-espresso">From recipe</span>
        </button>
        <button
          type="button"
          onClick={() => setSource('quick-add')}
          className="pressable flex flex-col items-start gap-2 rounded-[20px] bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] p-4 text-left ring-1 ring-honey/30"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-warm-white text-[#A9791B] shadow-soft">
            <Carrot className="h-5 w-5" />
          </span>
          <span className="font-display font-semibold text-espresso">Custom food</span>
        </button>
      </div>

      {/* Recent — one tap to re-log */}
      {recentUnique.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-espresso/45">
            <RotateCcw className="h-3 w-3" /> Recent
          </p>
          <div className="flex flex-wrap gap-2">
            {recentUnique.map((e) => (
              <button
                key={e.id}
                type="button"
                onClick={() => relog(e)}
                disabled={createFoodEntry.isPending}
                className="pressable flex items-center gap-2 rounded-full border border-latte bg-warm-white py-1.5 pl-1.5 pr-3.5 text-sm text-espresso hover:border-emerald/40 hover:bg-emerald/[0.04] disabled:opacity-50"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-cream text-base">
                  {e.recipe?.emoji || '🍽️'}
                </span>
                <span className="font-medium">{entryLabel(e)}</span>
                <span className="metric text-xs text-espresso/45">{Math.round(e.calories)} cal</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Favorites */}
      {(favorites?.length ?? 0) > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-espresso/45">
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
