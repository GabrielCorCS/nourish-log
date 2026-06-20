import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useHouseholdId } from '@/hooks/useHousehold'
import type { WishlistItem, WishlistItemInsert } from '@/types/database'

const WISHLIST_KEY = ['wishlist']

export function useWishlist() {
  return useQuery({
    queryKey: WISHLIST_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .order('is_done', { ascending: true })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as WishlistItem[]
    },
  })
}

export function useAddWishlistItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const householdId = useHouseholdId()

  return useMutation({
    mutationFn: async (input: {
      title: string
      note?: string | null
      url?: string | null
    }) => {
      if (!householdId) throw new Error('No household found for this account')
      const row: WishlistItemInsert = {
        household_id: householdId,
        created_by: user?.id ?? null,
        title: input.title,
        note: input.note ?? null,
        url: input.url ?? null,
      }
      const { error } = await supabase.from('wishlist_items').insert(row)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  })
}

export function useToggleWishlistDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isDone }: { id: string; isDone: boolean }) => {
      const { error } = await supabase
        .from('wishlist_items')
        .update({ is_done: isDone })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  })
}

export function useDeleteWishlistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wishlist_items').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: WISHLIST_KEY }),
  })
}
