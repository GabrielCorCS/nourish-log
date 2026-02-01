import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Input, Textarea, Select } from '@/components/ui'
import { EmojiPicker, MacroDisplay } from '@/components/shared'
import { IngredientPicker } from './IngredientPicker'
import { useCreateRecipe, useUpdateRecipe, useRecipe } from '@/hooks'
import { useUIStore } from '@/stores'
import { calculateRecipeNutrition } from '@/lib/nutrition'
import type { Ingredient, RecipeWithIngredients } from '@/types/database'

interface SelectedIngredient {
  ingredient: Ingredient
  quantity: number
}

interface RecipeFormProps {
  recipeId?: string
}

export function RecipeForm({ recipeId }: RecipeFormProps) {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const { data: existingRecipe, isLoading: isLoadingRecipe } = useRecipe(
    recipeId || ''
  )
  const createRecipe = useCreateRecipe()
  const updateRecipe = useUpdateRecipe()

  const [formData, setFormData] = useState({
    name: '',
    emoji: '',
    description: '',
    instructions: '',
    servings: 1,
    prep_time: 0,
    cook_time: 0,
  })

  const [selectedIngredients, setSelectedIngredients] = useState<
    SelectedIngredient[]
  >([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load existing recipe data
  useEffect(() => {
    if (existingRecipe) {
      setFormData({
        name: existingRecipe.name,
        emoji: existingRecipe.emoji || '',
        description: existingRecipe.description || '',
        instructions: existingRecipe.instructions || '',
        servings: existingRecipe.servings,
        prep_time: existingRecipe.prep_time || 0,
        cook_time: existingRecipe.cook_time || 0,
      })

      setSelectedIngredients(
        existingRecipe.recipe_ingredients.map((ri) => ({
          ingredient: ri.ingredient,
          quantity: ri.quantity,
        }))
      )
    }
  }, [existingRecipe])

  // Calculate nutrition totals
  const nutrition = useMemo(() => {
    return calculateRecipeNutrition(selectedIngredients)
  }, [selectedIngredients])

  const perServing = useMemo(() => {
    const servings = formData.servings || 1
    return {
      calories: nutrition.calories / servings,
      protein: nutrition.protein / servings,
      carbs: nutrition.carbs / servings,
      fat: nutrition.fat / servings,
    }
  }, [nutrition, formData.servings])

  const handleAddIngredient = (ingredient: Ingredient, quantity: number) => {
    setSelectedIngredients((prev) => [...prev, { ingredient, quantity }])
  }

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredients((prev) =>
      prev.filter((si) => si.ingredient.id !== ingredientId)
    )
  }

  const handleUpdateQuantity = (ingredientId: string, quantity: number) => {
    setSelectedIngredients((prev) =>
      prev.map((si) =>
        si.ingredient.id === ingredientId ? { ...si, quantity } : si
      )
    )
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Recipe name is required'
    }
    if (selectedIngredients.length === 0) {
      newErrors.ingredients = 'Add at least one ingredient'
    }
    if (formData.servings < 1) {
      newErrors.servings = 'Servings must be at least 1'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    try {
      const recipeData = {
        ...formData,
        total_calories: nutrition.calories,
        total_protein: nutrition.protein,
        total_carbs: nutrition.carbs,
        total_fat: nutrition.fat,
      }

      const ingredients = selectedIngredients.map((si) => ({
        ingredientId: si.ingredient.id,
        quantity: si.quantity,
      }))

      if (recipeId) {
        await updateRecipe.mutateAsync({
          id: recipeId,
          recipe: recipeData,
          ingredients,
        })
        addToast('Recipe updated successfully', 'success')
      } else {
        await createRecipe.mutateAsync({
          recipe: recipeData,
          ingredients,
        })
        addToast('Recipe created successfully', 'success')
      }

      navigate('/recipes')
    } catch {
      addToast('Failed to save recipe', 'error')
    }
  }

  const isLoading =
    isLoadingRecipe || createRecipe.isPending || updateRecipe.isPending

  if (recipeId && isLoadingRecipe) {
    return (
      <Card variant="elevated" padding="lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-latte/30 rounded w-1/3" />
          <div className="h-10 bg-latte/30 rounded" />
          <div className="h-32 bg-latte/30 rounded" />
        </div>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card variant="elevated" padding="lg">
        <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
          Recipe Details
        </h2>

        <div className="space-y-4">
          <div className="flex gap-4">
            <EmojiPicker
              value={formData.emoji}
              onChange={(emoji) => setFormData({ ...formData, emoji })}
            />
            <div className="flex-1">
              <Input
                label="Recipe Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                error={errors.name}
                placeholder="e.g., Grilled Chicken Salad"
              />
            </div>
          </div>

          <Textarea
            label="Description (optional)"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="A brief description of your recipe..."
            rows={2}
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Servings"
              type="number"
              value={formData.servings}
              onChange={(e) =>
                setFormData({ ...formData, servings: Number(e.target.value) })
              }
              error={errors.servings}
              min={1}
            />
            <Input
              label="Prep Time (min)"
              type="number"
              value={formData.prep_time}
              onChange={(e) =>
                setFormData({ ...formData, prep_time: Number(e.target.value) })
              }
              min={0}
            />
            <Input
              label="Cook Time (min)"
              type="number"
              value={formData.cook_time}
              onChange={(e) =>
                setFormData({ ...formData, cook_time: Number(e.target.value) })
              }
              min={0}
            />
          </div>
        </div>
      </Card>

      {/* Ingredients */}
      <Card variant="elevated" padding="lg">
        <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
          Ingredients
        </h2>
        {errors.ingredients && (
          <p className="text-sm text-terracotta mb-4">{errors.ingredients}</p>
        )}
        <IngredientPicker
          selectedIngredients={selectedIngredients}
          onAdd={handleAddIngredient}
          onRemove={handleRemoveIngredient}
          onUpdateQuantity={handleUpdateQuantity}
        />
      </Card>

      {/* Nutrition Preview */}
      {selectedIngredients.length > 0 && (
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
            Nutrition (per serving)
          </h2>
          <MacroDisplay
            calories={perServing.calories}
            protein={perServing.protein}
            carbs={perServing.carbs}
            fat={perServing.fat}
            size="lg"
            layout="grid"
          />
        </Card>
      )}

      {/* Instructions */}
      <Card variant="elevated" padding="lg">
        <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
          Instructions (optional)
        </h2>
        <Textarea
          value={formData.instructions}
          onChange={(e) =>
            setFormData({ ...formData, instructions: e.target.value })
          }
          placeholder="Step-by-step cooking instructions..."
          rows={6}
        />
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate('/recipes')}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {recipeId ? 'Update' : 'Create'} Recipe
        </Button>
      </div>
    </form>
  )
}
