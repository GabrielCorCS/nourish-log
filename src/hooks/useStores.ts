import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface Store {
  id: string
  user_id: string
  name: string
  emoji: string | null
  created_at: string
  updated_at: string
}

export interface StoreInsert {
  name: string
  emoji?: string | null
}

export interface StoreUpdate {
  id: string
  name?: string
  emoji?: string | null
}

const STORES_KEY = ['stores']

export function useStores() {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...STORES_KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Store[]
    },
    enabled: !!user,
  })
}

export function useCreateStore() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (store: StoreInsert) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('stores')
        .insert({ ...store, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as Store
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY })
    },
  })
}

export function useUpdateStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: StoreUpdate) => {
      const { data, error } = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Store
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY })
    },
  })
}

export function useDeleteStore() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('stores').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORES_KEY })
    },
  })
}
