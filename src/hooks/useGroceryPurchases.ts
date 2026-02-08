import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { Ingredient, IngredientCategory } from '@/types/database'
import type { Store } from './useStores'

export interface GroceryPurchase {
  id: string
  user_id: string
  ingredient_id: string | null
  store_id: string | null
  quantity: number
  unit: string
  price: number
  purchased_at: string
  notes: string | null
  created_at: string
  ingredient?: Ingredient | null
  store?: Store | null
}

export interface GroceryPurchaseInsert {
  ingredient_id?: string | null
  store_id?: string | null
  quantity?: number
  unit?: string
  price: number
  purchased_at?: string
  notes?: string | null
}

export interface GroceryPurchaseUpdate {
  id: string
  ingredient_id?: string | null
  store_id?: string | null
  quantity?: number
  unit?: string
  price?: number
  purchased_at?: string
  notes?: string | null
}

const PURCHASES_KEY = ['grocery_purchases']

export function useGroceryPurchases(dateRange?: { start: Date; end: Date }) {
  const { user } = useAuth()

  return useQuery({
    queryKey: [...PURCHASES_KEY, user?.id, dateRange?.start?.toISOString(), dateRange?.end?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from('grocery_purchases')
        .select(`
          *,
          ingredient:ingredients(*),
          store:stores(*)
        `)
        .order('purchased_at', { ascending: false })

      if (dateRange) {
        query = query
          .gte('purchased_at', dateRange.start.toISOString())
          .lte('purchased_at', dateRange.end.toISOString())
      }

      const { data, error } = await query

      if (error) throw error
      return data as GroceryPurchase[]
    },
    enabled: !!user,
  })
}

export function useCreateGroceryPurchase() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (purchase: GroceryPurchaseInsert) => {
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('grocery_purchases')
        .insert({ ...purchase, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data as GroceryPurchase
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY })
    },
  })
}

export function useDeleteGroceryPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('grocery_purchases').delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PURCHASES_KEY })
    },
  })
}

// Analytics helpers
export interface SpendingByCategory {
  category: IngredientCategory
  total: number
  count: number
}

export interface SpendingByStore {
  storeId: string | null
  storeName: string
  storeEmoji: string | null
  total: number
  count: number
}

export interface SpendingByPeriod {
  period: string
  total: number
  count: number
}

export function calculateSpendingByCategory(purchases: GroceryPurchase[]): SpendingByCategory[] {
  const categoryMap = new Map<IngredientCategory, { total: number; count: number }>()

  purchases.forEach((p) => {
    if (p.ingredient?.category) {
      const existing = categoryMap.get(p.ingredient.category) || { total: 0, count: 0 }
      categoryMap.set(p.ingredient.category, {
        total: existing.total + p.price,
        count: existing.count + 1,
      })
    }
  })

  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    ...data,
  }))
}

export function calculateSpendingByStore(purchases: GroceryPurchase[]): SpendingByStore[] {
  const storeMap = new Map<string | null, { name: string; emoji: string | null; total: number; count: number }>()

  purchases.forEach((p) => {
    const storeId = p.store_id
    const existing = storeMap.get(storeId) || {
      name: p.store?.name || 'Unknown Store',
      emoji: p.store?.emoji || null,
      total: 0,
      count: 0,
    }
    storeMap.set(storeId, {
      ...existing,
      total: existing.total + p.price,
      count: existing.count + 1,
    })
  })

  return Array.from(storeMap.entries()).map(([storeId, data]) => ({
    storeId,
    storeName: data.name,
    storeEmoji: data.emoji,
    total: data.total,
    count: data.count,
  }))
}

export function calculateTotalSpending(purchases: GroceryPurchase[]): number {
  return purchases.reduce((sum, p) => sum + p.price, 0)
}
