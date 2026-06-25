import { useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useHouseholdId } from '@/hooks/useHousehold'
import type { StoreKind } from '@/lib/constants'

export interface Store {
  id: string
  user_id: string
  name: string
  emoji: string | null
  kind: StoreKind
  created_at: string
  updated_at: string
}

export interface StoreInsert {
  name: string
  emoji?: string | null
  kind?: StoreKind
}

export interface StoreUpdate {
  id: string
  name?: string
  emoji?: string | null
  kind?: StoreKind
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
  const householdId = useHouseholdId()

  return useMutation({
    mutationFn: async (store: StoreInsert) => {
      if (!user) throw new Error('Not authenticated')
      // Stores are a shared household resource — RLS requires household_id on
      // both insert (WITH CHECK) and read, so a store created without it would
      // be rejected/invisible.
      if (!householdId) throw new Error('No household found for the current user')

      const { data, error } = await supabase
        .from('stores')
        .insert({ ...store, user_id: user.id, household_id: householdId })
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

/**
 * Returns an async resolver that turns a free-typed store name into a store id,
 * creating the store on the fly if it doesn't exist yet (case-insensitive match).
 * Lets forms accept any store by typing instead of only picking from a dropdown.
 */
export function useFindOrCreateStore() {
  const { data: stores } = useStores()
  const createStore = useCreateStore()

  return useCallback(
    async (rawName: string, kind: StoreKind = 'grocery'): Promise<string | null> => {
      const name = rawName.trim()
      if (!name) return null

      const existing = stores?.find(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      )
      if (existing) return existing.id

      const created = await createStore.mutateAsync({ name, kind })
      return created.id
    },
    [stores, createStore]
  )
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
