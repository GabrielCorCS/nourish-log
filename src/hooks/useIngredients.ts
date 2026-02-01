import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getCurrentUserId } from '@/lib/supabase'
import type {
  Ingredient,
  IngredientCategory,
} from '@/types/database'

const INGREDIENTS_KEY = ['ingredients']

export function useIngredients(category?: IngredientCategory | 'all') {
  return useQuery({
    queryKey: [...INGREDIENTS_KEY, category],
    queryFn: async () => {
      const userId = await getCurrentUserId()

      let query = supabase
        .from('ingredients')
        .select('*')
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .order('name')

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Ingredient[]
    },
  })
}

export function useIngredient(id: string) {
  return useQuery({
    queryKey: [...INGREDIENTS_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Ingredient
    },
    enabled: !!id,
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ingredient: {
      name: string
      emoji?: string | null
      category: IngredientCategory
      serving_size: number
      serving_unit: string
      calories: number
      protein: number
      carbs: number
      fat: number
      is_default?: boolean
    }) => {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase
        .from('ingredients')
        .insert({
          user_id: userId,
          name: ingredient.name,
          emoji: ingredient.emoji,
          category: ingredient.category,
          serving_size: ingredient.serving_size,
          serving_unit: ingredient.serving_unit,
          calories: ingredient.calories,
          protein: ingredient.protein,
          carbs: ingredient.carbs,
          fat: ingredient.fat,
          is_default: ingredient.is_default ?? false,
        })
        .select()
        .single()

      if (error) throw error
      return data as Ingredient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
    },
  })
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string
      name?: string
      emoji?: string | null
      category?: IngredientCategory
      serving_size?: number
      serving_unit?: string
      calories?: number
      protein?: number
      carbs?: number
      fat?: number
    }) => {
      const { data, error } = await supabase
        .from('ingredients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Ingredient
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
    },
  })
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ingredients').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENTS_KEY })
    },
  })
}

export function useSearchIngredients(search: string) {
  return useQuery({
    queryKey: [...INGREDIENTS_KEY, 'search', search],
    queryFn: async () => {
      const userId = await getCurrentUserId()

      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .or(`user_id.eq.${userId},is_default.eq.true`)
        .ilike('name', `%${search}%`)
        .order('name')
        .limit(20)

      if (error) throw error
      return data as Ingredient[]
    },
    enabled: search.length >= 2,
  })
}
