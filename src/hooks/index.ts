export {
  useIngredients,
  useIngredient,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useSearchIngredients,
} from './useIngredients'

export {
  useRecipes,
  useRecipe,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useToggleFavorite,
  useSearchRecipes,
} from './useRecipes'

export {
  useFoodEntriesByDate,
  useTodayEntries,
  useWeeklyEntries,
  useCreateFoodEntry,
  useUpdateFoodEntry,
  useUpdateFoodEntryWithIngredients,
  useDeleteFoodEntry,
  calculateDailyTotals,
} from './useFoodEntries'

export {
  useUserSettings,
  useUpdateUserSettings,
  useUserStreak,
  useGoals,
} from './useUserSettings'

export { useHousehold, useHouseholdId } from './useHousehold'

export { useInvitations } from './useInvitations'
export { useInventory } from './useInventory'
export { useShoppingList } from './useShoppingList'

export {
  useStores,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
  useFindOrCreateStore,
} from './useStores'

export {
  useGroceryPurchases,
  useCreateGroceryPurchase,
  useDeleteGroceryPurchase,
  calculateSpendingByCategory,
  calculateSpendingByStore,
  calculateTotalSpending,
} from './useGroceryPurchases'
