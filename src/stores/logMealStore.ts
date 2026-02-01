import { create } from 'zustand'
import type { MealType, Recipe, Ingredient } from '@/types/database'

interface SelectedIngredient {
  ingredient: Ingredient
  quantity: number
}

interface LogMealStore {
  // Current step
  step: 'meal-type' | 'source' | 'recipe' | 'ingredients' | 'servings' | 'preview'

  // Selection state
  mealType: MealType | null
  source: 'recipe' | 'quick-add' | null
  selectedRecipe: Recipe | null
  selectedIngredients: SelectedIngredient[]
  servings: number
  notes: string

  // Calculated totals
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number

  // Actions
  setStep: (step: LogMealStore['step']) => void
  setMealType: (type: MealType) => void
  setSource: (source: 'recipe' | 'quick-add') => void
  setSelectedRecipe: (recipe: Recipe | null) => void
  addIngredient: (ingredient: Ingredient, quantity: number) => void
  updateIngredientQuantity: (ingredientId: string, quantity: number) => void
  removeIngredient: (ingredientId: string) => void
  setServings: (servings: number) => void
  setNotes: (notes: string) => void
  calculateTotals: () => void
  reset: () => void
}

const initialState = {
  step: 'meal-type' as const,
  mealType: null,
  source: null,
  selectedRecipe: null,
  selectedIngredients: [],
  servings: 1,
  notes: '',
  totalCalories: 0,
  totalProtein: 0,
  totalCarbs: 0,
  totalFat: 0,
}

export const useLogMealStore = create<LogMealStore>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setMealType: (mealType) => set({ mealType, step: 'source' }),

  setSource: (source) =>
    set({
      source,
      step: source === 'recipe' ? 'recipe' : 'ingredients',
    }),

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

  addIngredient: (ingredient, quantity) => {
    const { selectedIngredients } = get()
    const existing = selectedIngredients.find(
      (si) => si.ingredient.id === ingredient.id
    )

    if (existing) {
      set({
        selectedIngredients: selectedIngredients.map((si) =>
          si.ingredient.id === ingredient.id
            ? { ...si, quantity: si.quantity + quantity }
            : si
        ),
      })
    } else {
      set({
        selectedIngredients: [...selectedIngredients, { ingredient, quantity }],
      })
    }
    get().calculateTotals()
  },

  updateIngredientQuantity: (ingredientId, quantity) => {
    set({
      selectedIngredients: get().selectedIngredients.map((si) =>
        si.ingredient.id === ingredientId ? { ...si, quantity } : si
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

  calculateTotals: () => {
    const { selectedIngredients } = get()
    const totals = selectedIngredients.reduce(
      (acc, { ingredient, quantity }) => ({
        calories: acc.calories + ingredient.calories * quantity,
        protein: acc.protein + ingredient.protein * quantity,
        carbs: acc.carbs + ingredient.carbs * quantity,
        fat: acc.fat + ingredient.fat * quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    )

    set({
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
    })
  },

  reset: () => set(initialState),
}))
