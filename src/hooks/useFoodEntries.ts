import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useViewStore } from '@/stores/viewStore'
import { getDayRange, toISODateString } from '@/lib/dates'
import type { AmountUnit } from '@/lib/nutrition'
import type {
  FoodEntry,
  FoodEntryInsert,
  FoodEntryUpdate,
  FoodEntryWithDetails,
  FoodEntryIngredientInsert,
} from '@/types/database'

const FOOD_ENTRIES_KEY = ['food-entries']

// Personal logs are now visible household-wide (RLS), so queries MUST scope to a
// subject user_id. Pass `targetUserId` to read the partner's day (proxy/partner views).
export function useFoodEntriesByDate(date: Date, targetUserId?: string) {
  const { user } = useAuth()
  const viewUserId = useViewStore((s) => s.viewUserId)
  // Explicit target (e.g. partner card) wins; otherwise follow the global view toggle.
  const subjectId = targetUserId ?? viewUserId ?? user?.id
  const dateStr = toISODateString(date)

  return useQuery({
    queryKey: [...FOOD_ENTRIES_KEY, subjectId, dateStr],
    queryFn: async () => {
      if (!subjectId) return []

      const { start, end } = getDayRange(date)

      const { data, error } = await supabase
        .from('food_entries')
        .select(
          `
          *,
          recipe:recipes (*),
          food_entry_ingredients (
            *,
            ingredient:ingredients (*)
          )
        `
        )
        .eq('user_id', subjectId)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .order('logged_at', { ascending: true })

      if (error) throw error
      return data as FoodEntryWithDetails[]
    },
    enabled: !!subjectId,
  })
}

export function useTodayEntries() {
  return useFoodEntriesByDate(new Date())
}

export function useWeeklyEntries(startDate: Date, endDate: Date) {
  const { user } = useAuth()
  const viewUserId = useViewStore((s) => s.viewUserId)
  const userId = viewUserId ?? user?.id

  return useQuery({
    queryKey: [
      ...FOOD_ENTRIES_KEY,
      'weekly',
      userId,
      toISODateString(startDate),
      toISODateString(endDate),
    ],
    queryFn: async () => {
      if (!userId) return []

      const { start } = getDayRange(startDate)
      const { end } = getDayRange(endDate)

      const { data, error } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('logged_at', start)
        .lte('logged_at', end)
        .order('logged_at', { ascending: true })

      if (error) throw error
      return data as FoodEntry[]
    },
    enabled: !!userId,
  })
}

interface CreateFoodEntryInput {
  entry: Omit<FoodEntryInsert, 'user_id'>
  // amount+unit drive the new scaling model; quantity (servings-equivalent) is
  // kept for back-compat with the recipe trigger and older reads.
  ingredients?: { ingredientId: string; amount: number; unit: AmountUnit; quantity: number }[]
  // For proxy logging: whose log this belongs to (defaults to the current user).
  subjectUserId?: string
}

export function useCreateFoodEntry() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async ({ entry, ingredients, subjectUserId }: CreateFoodEntryInput) => {
      if (!user) throw new Error('Not authenticated')

      const { data: newEntry, error: entryError } = await supabase
        .from('food_entries')
        .insert({ ...entry, user_id: subjectUserId ?? user.id, logged_by: user.id })
        .select()
        .single()

      if (entryError) throw entryError

      if (ingredients && ingredients.length > 0) {
        const entryIngredients: FoodEntryIngredientInsert[] = ingredients.map(
          (ing) => ({
            food_entry_id: newEntry.id,
            ingredient_id: ing.ingredientId,
            amount: ing.amount,
            unit: ing.unit,
            quantity: ing.quantity,
          })
        )

        const { error: ingredientsError } = await supabase
          .from('food_entry_ingredients')
          .insert(entryIngredients)

        if (ingredientsError) throw ingredientsError
      }

      return newEntry as FoodEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOOD_ENTRIES_KEY })
    },
  })
}

export function useUpdateFoodEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: FoodEntryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('food_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as FoodEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOOD_ENTRIES_KEY })
    },
  })
}

interface UpdateEntryWithIngredientsInput {
  entryId: string
  meal_type: FoodEntry['meal_type']
  title: string | null
  notes: string | null
  servings: number
  totals: { calories: number; protein: number; carbs: number; fat: number }
  // Desired ingredient rows. Rows with an `id` already exist (update); rows
  // without one are newly added (insert).
  upserts: {
    id?: string
    ingredient_id: string
    amount: number
    unit: string
    quantity: number
  }[]
  // Existing food_entry_ingredients rows the user removed.
  deletedIds: string[]
}

// Edits a logged entry down to the individual ingredient level: reconciles the
// food_entry_ingredients rows (insert / update / delete) and rewrites the parent
// entry's cached macro totals so the journal stays consistent.
export function useUpdateFoodEntryWithIngredients() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      entryId,
      meal_type,
      title,
      notes,
      servings,
      totals,
      upserts,
      deletedIds,
    }: UpdateEntryWithIngredientsInput) => {
      // 1. Remove rows the user deleted.
      if (deletedIds.length > 0) {
        const { error } = await supabase
          .from('food_entry_ingredients')
          .delete()
          .in('id', deletedIds)
        if (error) throw error
      }

      // 2. Update existing rows.
      for (const u of upserts.filter((r) => r.id)) {
        const { error } = await supabase
          .from('food_entry_ingredients')
          .update({
            ingredient_id: u.ingredient_id,
            amount: u.amount,
            unit: u.unit,
            quantity: u.quantity,
          })
          .eq('id', u.id as string)
        if (error) throw error
      }

      // 3. Insert newly added rows.
      const inserts = upserts.filter((r) => !r.id)
      if (inserts.length > 0) {
        const rows: FoodEntryIngredientInsert[] = inserts.map((u) => ({
          food_entry_id: entryId,
          ingredient_id: u.ingredient_id,
          amount: u.amount,
          unit: u.unit,
          quantity: u.quantity,
        }))
        const { error } = await supabase
          .from('food_entry_ingredients')
          .insert(rows)
        if (error) throw error
      }

      // 4. Rewrite the parent entry's denormalised totals + metadata.
      const { data, error } = await supabase
        .from('food_entries')
        .update({
          meal_type,
          title,
          notes,
          servings,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
        })
        .eq('id', entryId)
        .select()
        .single()

      if (error) throw error
      return data as FoodEntry
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOOD_ENTRIES_KEY })
    },
  })
}

export function useDeleteFoodEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('food_entries').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FOOD_ENTRIES_KEY })
    },
  })
}

export function calculateDailyTotals(entries: FoodEntry[]) {
  return entries.reduce(
    (totals, entry) => ({
      calories: totals.calories + entry.calories,
      protein: totals.protein + entry.protein,
      carbs: totals.carbs + entry.carbs,
      fat: totals.fat + entry.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}
