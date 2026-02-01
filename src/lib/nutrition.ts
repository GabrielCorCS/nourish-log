import type { Ingredient, Recipe, RecipeWithIngredients } from '@/types/database'

export interface NutritionTotals {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// Calculate nutrition for a single ingredient at a given quantity (in servings)
export function calculateIngredientNutrition(
  ingredient: Ingredient,
  quantity: number
): NutritionTotals {
  return {
    calories: ingredient.calories * quantity,
    protein: ingredient.protein * quantity,
    carbs: ingredient.carbs * quantity,
    fat: ingredient.fat * quantity,
  }
}

// Calculate total nutrition for a recipe (sum of all ingredients)
export function calculateRecipeNutrition(
  recipeIngredients: { ingredient: Ingredient; quantity: number }[]
): NutritionTotals {
  return recipeIngredients.reduce(
    (totals, { ingredient, quantity }) => {
      const ingredientNutrition = calculateIngredientNutrition(ingredient, quantity)
      return {
        calories: totals.calories + ingredientNutrition.calories,
        protein: totals.protein + ingredientNutrition.protein,
        carbs: totals.carbs + ingredientNutrition.carbs,
        fat: totals.fat + ingredientNutrition.fat,
      }
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

// Calculate per-serving nutrition for a recipe
export function calculatePerServingNutrition(
  recipe: RecipeWithIngredients | Recipe,
  servings?: number
): NutritionTotals {
  const numServings = servings || recipe.servings || 1

  // If recipe has pre-calculated totals
  if ('total_calories' in recipe) {
    return {
      calories: recipe.total_calories / numServings,
      protein: recipe.total_protein / numServings,
      carbs: recipe.total_carbs / numServings,
      fat: recipe.total_fat / numServings,
    }
  }

  return { calories: 0, protein: 0, carbs: 0, fat: 0 }
}

// Calculate nutrition for a meal entry (recipe at given servings)
export function calculateMealNutrition(
  recipe: Recipe,
  servings: number
): NutritionTotals {
  const perServing = calculatePerServingNutrition(recipe)
  return {
    calories: perServing.calories * servings,
    protein: perServing.protein * servings,
    carbs: perServing.carbs * servings,
    fat: perServing.fat * servings,
  }
}

// Format nutrition value for display
export function formatNutritionValue(value: number, unit: string = 'g'): string {
  const rounded = Math.round(value * 10) / 10
  if (unit === 'kcal' || unit === 'cal') {
    return `${Math.round(value)}`
  }
  return `${rounded}${unit}`
}

// Get macro percentages (for pie charts)
export function getMacroPercentages(nutrition: NutritionTotals): {
  protein: number
  carbs: number
  fat: number
} {
  // Calories per gram: protein 4, carbs 4, fat 9
  const proteinCals = nutrition.protein * 4
  const carbsCals = nutrition.carbs * 4
  const fatCals = nutrition.fat * 9
  const totalCals = proteinCals + carbsCals + fatCals

  if (totalCals === 0) {
    return { protein: 33, carbs: 33, fat: 34 }
  }

  return {
    protein: Math.round((proteinCals / totalCals) * 100),
    carbs: Math.round((carbsCals / totalCals) * 100),
    fat: Math.round((fatCals / totalCals) * 100),
  }
}

// Check if within daily goal
export function isWithinGoal(current: number, goal: number, tolerance: number = 0.1): boolean {
  return current <= goal * (1 + tolerance)
}

// Get progress status
export function getProgressStatus(
  current: number,
  goal: number
): 'under' | 'good' | 'over' {
  const percentage = (current / goal) * 100
  if (percentage < 80) return 'under'
  if (percentage <= 110) return 'good'
  return 'over'
}
