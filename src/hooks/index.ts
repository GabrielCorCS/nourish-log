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
  useDeleteFoodEntry,
  calculateDailyTotals,
} from './useFoodEntries'

export {
  useUserSettings,
  useUpdateUserSettings,
  useUserStreak,
  useGoals,
} from './useUserSettings'

export { useInvitations } from './useInvitations'
export { useInventory } from './useInventory'
export { useShoppingList } from './useShoppingList'

export {
  useStores,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
} from './useStores'

export {
  useGroceryPurchases,
  useCreateGroceryPurchase,
  useDeleteGroceryPurchase,
  calculateSpendingByCategory,
  calculateSpendingByStore,
  calculateTotalSpending,
} from './useGroceryPurchases'
