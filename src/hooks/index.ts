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
  useWeekdayGoals,
  useUpsertWeekdayGoal,
  useDeleteWeekdayGoal,
  type WeekdayGoal,
} from './useUserSettings'

export { useHousehold, useHouseholdId } from './useHousehold'

export {
  useAvailabilityWindows,
  useUpsertAvailabilityWindow,
  useDeleteAvailabilityWindow,
  useCalendarTasks,
  useUpcomingTasksFor,
  useCreateCalendarTask,
  useDeleteCalendarTask,
  type AvailabilityWindowRow,
  type CalendarTask,
} from './useSchedule'

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
  calculateSpendingByCard,
  calculateTotalSpending,
} from './useGroceryPurchases'
