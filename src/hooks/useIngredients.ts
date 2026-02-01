import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useUserStore } from '@/stores/userStore'
import type {
  Ingredient,
  IngredientInsert,
  IngredientUpdate,
  IngredientCategory,
} from '@/types/database'

const INGREDIENTS_KEY = ['ingredients']

export function useIngredients(category?: IngredientCategory | 'all') {
  const { currentUser } = useUserStore()
  const userId = currentUser?.id

  return useQuery({
    queryKey: [...INGREDIENTS_KEY, userId, category],
    queryFn: async () => {
      let query = supabase
        .from('ingredients')
        .select('*')
        .order('name')

      if (userId) {
        query = query.or(`user_id.eq.${userId},is_default.eq.true`)
      } else {
        query = query.eq('is_default', true)
      }

      if (category && category !== 'all') {
        query = query.eq('category', category)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Ingredient[]
    },
    enabled: true,
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
  const { currentUser } = useUserStore()

  return useMutation({
    mutationFn: async (ingredient: Omit<IngredientInsert, 'user_id'>) => {
      if (!currentUser) throw new Error('No user selected')

      const { data, error } = await supabase
        .from('ingredients')
        .insert({ ...ingredient, user_id: currentUser.id })
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
    }: IngredientUpdate & { id: string }) => {
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
  const { currentUser } = useUserStore()
  const userId = currentUser?.id

  return useQuery({
    queryKey: [...INGREDIENTS_KEY, 'search', userId, search],
    queryFn: async () => {
      let query = supabase
        .from('ingredients')
        .select('*')
        .ilike('name', `%${search}%`)
        .order('name')
        .limit(20)

      if (userId) {
        query = query.or(`user_id.eq.${userId},is_default.eq.true`)
      } else {
        query = query.eq('is_default', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Ingredient[]
    },
    enabled: search.length >= 2,
  })
}
