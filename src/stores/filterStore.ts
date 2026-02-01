import { create } from 'zustand'
import type { IngredientCategory } from '@/types/database'

interface FilterStore {
  // Pantry filters
  pantrySearch: string
  pantryCategory: IngredientCategory | 'all'

  // Recipe filters
  recipeSearch: string
  recipeFavoritesOnly: boolean

  // Actions
  setPantrySearch: (search: string) => void
  setPantryCategory: (category: IngredientCategory | 'all') => void
  setRecipeSearch: (search: string) => void
  setRecipeFavoritesOnly: (favoritesOnly: boolean) => void
  resetPantryFilters: () => void
  resetRecipeFilters: () => void
}

export const useFilterStore = create<FilterStore>((set) => ({
  pantrySearch: '',
  pantryCategory: 'all',
  recipeSearch: '',
  recipeFavoritesOnly: false,

  setPantrySearch: (pantrySearch) => set({ pantrySearch }),
  setPantryCategory: (pantryCategory) => set({ pantryCategory }),
  setRecipeSearch: (recipeSearch) => set({ recipeSearch }),
  setRecipeFavoritesOnly: (recipeFavoritesOnly) => set({ recipeFavoritesOnly }),

  resetPantryFilters: () => set({ pantrySearch: '', pantryCategory: 'all' }),
  resetRecipeFilters: () => set({ recipeSearch: '', recipeFavoritesOnly: false }),
}))
