import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface ShoppingListItem {
  id: string
  user_id: string
  ingredient_id: string
  quantity_needed: number
  is_purchased: boolean
  auto_added: boolean
  created_at: string
  ingredient?: {
    id: string
    name: string
    emoji: string | null
  }
}

interface AddItemInput {
  ingredient_id: string
  quantity_needed: number
}

export function useShoppingList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['shopping-list', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('shopping_list')
        .select(`
          *,
          ingredient:ingredients(id, name, emoji)
        `)
        .eq('user_id', user.id)
        .order('is_purchased', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ShoppingListItem[]
    },
    enabled: !!user,
  })

  const addMutation = useMutation({
    mutationFn: async (input: AddItemInput) => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('shopping_list')
        .insert({
          user_id: user.id,
          ...input,
          auto_added: false,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isPurchased }: { id: string; isPurchased: boolean }) => {
      const { error } = await supabase
        .from('shopping_list')
        .update({ is_purchased: isPurchased })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })

  const clearPurchasedMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      
      const { error } = await supabase
        .from('shopping_list')
        .delete()
        .eq('user_id', user.id)
        .eq('is_purchased', true)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })

  return {
    items,
    isLoading,
    addItem: addMutation.mutateAsync,
    togglePurchased: (id: string, isPurchased: boolean) =>
      toggleMutation.mutate({ id, isPurchased }),
    removeItem: removeMutation.mutate,
    clearPurchased: clearPurchasedMutation.mutate,
    isAdding: addMutation.isPending,
  }
}
