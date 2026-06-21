import { create } from 'zustand'
import type { MealType, Recipe, Ingredient } from '@/types/database'
import { scaleIngredient, type AmountUnit } from '@/lib/nutrition'
import type { OffProduct } from '@/lib/openfoodfacts'

export interface SelectedIngredient {
  ingredient: Ingredient
  amount: number
  unit: AmountUnit
}

// The log flow now opens on a "hub" and defaults the meal type by time of day,
// so the common path (scan / re-log) is just a tap or two.
export type LogStep =
  | 'hub'
  | 'scan'
  | 'scan-confirm'
  | 'recipe'
  | 'ingredients'
  | 'servings'
  | 'preview'

export function mealTypeByHour(): MealType {
  const h = new Date().getHours()
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

interface LogMealStore {
  // Current step
  step: LogStep

  // Selection state
  mealType: MealType
  source: 'recipe' | 'quick-add' | null
  selectedRecipe: Recipe | null
  selectedIngredients: SelectedIngredient[]
  servings: number
  notes: string
  // Proxy logging: whose log this entry belongs to (null = the current user)
  subjectUserId: string | null

  // Barcode scan state
  scannedProduct: OffProduct | null
  scanGrams: number

  // Calculated totals
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number

  // Actions
  setStep: (step: LogStep) => void
  setMealType: (type: MealType) => void
  setSource: (source: 'recipe' | 'quick-add') => void
  setSelectedRecipe: (recipe: Recipe | null) => void
  setScannedProduct: (product: OffProduct | null) => void
  setScanGrams: (grams: number) => void
  addIngredient: (ingredient: Ingredient, amount?: number, unit?: AmountUnit) => void
  updateIngredient: (
    ingredientId: string,
    patch: { amount?: number; unit?: AmountUnit }
  ) => void
  removeIngredient: (ingredientId: string) => void
  setServings: (servings: number) => void
  setNotes: (notes: string) => void
  setSubject: (subjectUserId: string | null) => void
  calculateTotals: () => void
  reset: () => void
}

function freshState() {
  return {
    step: 'hub' as LogStep,
    mealType: mealTypeByHour(),
    source: null,
    selectedRecipe: null,
    selectedIngredients: [] as SelectedIngredient[],
    servings: 1,
    notes: '',
    subjectUserId: null as string | null,
    scannedProduct: null as OffProduct | null,
    scanGrams: 100,
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
  }
}

export const useLogMealStore = create<LogMealStore>((set, get) => ({
  ...freshState(),

  setStep: (step) => set({ step }),

  setMealType: (mealType) => set({ mealType }),

  setSource: (source) =>
    set({
      source,
      step: source === 'recipe' ? 'recipe' : 'ingredients',
    }),

  setScannedProduct: (scannedProduct) => set({ scannedProduct }),

  setScanGrams: (scanGrams) => set({ scanGrams: Math.max(1, scanGrams) }),

  setSelectedRecipe: (recipe) => {
    if (recipe) {
      set({
        selectedRecipe: recipe,
        totalCalories: recipe.total_calories / recipe.servings,
        totalProtein: recipe.total_protein / recipe.servings,
        totalCarbs: recipe.total_carbs / recipe.servings,
        totalFat: recipe.total_fat / recipe.servings,
        step: 'servings',
      })
    } else {
      set({ selectedRecipe: null })
    }
  },

  addIngredient: (ingredient, amount = 1, unit = 'serving') => {
    const { selectedIngredients } = get()
    const existing = selectedIngredients.find(
      (si) => si.ingredient.id === ingredient.id
    )

    if (existing) {
      set({
        selectedIngredients: selectedIngredients.map((si) =>
          si.ingredient.id === ingredient.id
            ? { ...si, amount: si.amount + amount }
            : si
        ),
      })
    } else {
      set({
        selectedIngredients: [...selectedIngredients, { ingredient, amount, unit }],
      })
    }
    get().calculateTotals()
  },

  updateIngredient: (ingredientId, patch) => {
    set({
      selectedIngredients: get().selectedIngredients.map((si) =>
        si.ingredient.id === ingredientId ? { ...si, ...patch } : si
      ),
    })
    get().calculateTotals()
  },

  removeIngredient: (ingredientId) => {
    set({
      selectedIngredients: get().selectedIngredients.filter(
        (si) => si.ingredient.id !== ingredientId
      ),
    })
    get().calculateTotals()
  },

  setServings: (servings) => {
    const { selectedRecipe } = get()
    set({ servings })

    if (selectedRecipe) {
      const perServing = {
        calories: selectedRecipe.total_calories / selectedRecipe.servings,
        protein: selectedRecipe.total_protein / selectedRecipe.servings,
        carbs: selectedRecipe.total_carbs / selectedRecipe.servings,
        fat: selectedRecipe.total_fat / selectedRecipe.servings,
      }
      set({
        totalCalories: perServing.calories * servings,
        totalProtein: perServing.protein * servings,
        totalCarbs: perServing.carbs * servings,
        totalFat: perServing.fat * servings,
      })
    }
  },

  setNotes: (notes) => set({ notes }),

  setSubject: (subjectUserId) => set({ subjectUserId }),

  calculateTotals: () => {
    const { selectedIngredients } = get()
    const totals = selectedIngredients.reduce(
      (acc, { ingredient, amount, unit }) => {
        const n = scaleIngredient(ingredient, amount, unit)
        return {
          calories: acc.calories + n.calories,
          protein: acc.protein + n.protein,
          carbs: acc.carbs + n.carbs,
          fat: acc.fat + n.fat,
        }
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    set({
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
    })
  },

  reset: () => set(freshState()),
}))
