import type { IngredientCategory, MealType } from '@/types/database'

export const INGREDIENT_CATEGORIES: { value: IngredientCategory; label: string; emoji: string }[] = [
  { value: 'proteins', label: 'Proteins', emoji: '🥩' },
  { value: 'grains', label: 'Grains', emoji: '🌾' },
  { value: 'vegetables', label: 'Vegetables', emoji: '🥦' },
  { value: 'fruits', label: 'Fruits', emoji: '🍎' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'fats', label: 'Fats & Oils', emoji: '🫒' },
  { value: 'legumes', label: 'Legumes', emoji: '🫘' },
  { value: 'nuts', label: 'Nuts & Seeds', emoji: '🥜' },
  { value: 'condiments', label: 'Condiments', emoji: '🧂' },
  { value: 'beverages', label: 'Beverages', emoji: '🥤' },
]

export const MEAL_TYPES: { value: MealType; label: string; emoji: string; timeRange: string }[] = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅', timeRange: '6:00 - 10:00' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️', timeRange: '11:00 - 14:00' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙', timeRange: '17:00 - 21:00' },
  { value: 'snack', label: 'Snack', emoji: '🍿', timeRange: 'Anytime' },
]

export const SERVING_UNITS = [
  'g',
  'oz',
  'cup',
  'tbsp',
  'tsp',
  'ml',
  'piece',
  'slice',
  'serving',
]

export const DEFAULT_GOALS = {
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 65,
}

export const MACRO_COLORS = {
  calories: 'terracotta',
  protein: 'sage',
  carbs: 'honey',
  fat: 'blush',
} as const

export const COMMON_EMOJIS = [
  '🍳', '🥗', '🍕', '🍔', '🌮', '🍜', '🍱', '🥘',
  '🍲', '🥙', '🍝', '🍛', '🥪', '🥤', '🍵', '☕',
  '🥑', '🥦', '🍗', '🥩', '🐟', '🍤', '🥚', '🧀',
  '🍞', '🥐', '🥨', '🍚', '🍙', '🥗', '🥣', '🍿',
]

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'Home' },
  { path: '/journal', label: 'Journal', icon: 'BookOpen' },
  { path: '/recipes', label: 'Recipes', icon: 'ChefHat' },
  { path: '/pantry', label: 'Pantry', icon: 'Apple' },
  { path: '/progress', label: 'Progress', icon: 'TrendingUp' },
]
