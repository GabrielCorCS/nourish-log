import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface InventoryItem {
  id: string
  user_id: string
  ingredient_id: string
  quantity_on_hand: number
  unit: string
  threshold_quantity: number
  created_at: string
  updated_at: string
  ingredient?: {
    id: string
    name: string
    emoji: string | null
    category: string
  }
}

interface AddInventoryInput {
  ingredient_id: string
  quantity_on_hand: number
  threshold_quantity: number
  unit: string
}

interface UpdateInventoryInput {
  quantity_on_hand?: number
  threshold_quantity?: number
  unit?: string
}

export function useInventory() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ['inventory', user?.id],
    queryFn: async () => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('grocery_inventory')
        .select(`
          *,
          ingredient:ingredients(id, name, emoji, category)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as InventoryItem[]
    },
    enabled: !!user,
  })

  const addMutation = useMutation({
    mutationFn: async (input: AddInventoryInput) => {
      if (!user) throw new Error('Not authenticated')
      
      const { data, error } = await supabase
        .from('grocery_inventory')
        .insert({
          user_id: user.id,
          ...input,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateInventoryInput }) => {
      const { data, error } = await supabase
        .from('grocery_inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
      queryClient.invalidateQueries({ queryKey: ['shopping-list'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('grocery_inventory')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  return {
    inventory,
    isLoading,
    addInventoryItem: addMutation.mutateAsync,
    updateInventory: (id: string, updates: UpdateInventoryInput) =>
      updateMutation.mutateAsync({ id, updates }),
    deleteInventoryItem: deleteMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}
