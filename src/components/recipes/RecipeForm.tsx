import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Textarea } from '@/components/ui'
import { EmojiPicker, MacroDisplay } from '@/components/shared'
import { IngredientPicker } from './IngredientPicker'
import { useCreateRecipe, useUpdateRecipe, useRecipe } from '@/hooks'
import { useUIStore } from '@/stores'
import { scaleIngredient, servingsEquivalent, type AmountUnit } from '@/lib/nutrition'
import type { Ingredient } from '@/types/database'

interface SelectedIngredient {
  ingredient: Ingredient
  amount: number
  unit: AmountUnit
}

interface RecipeFormProps {
  recipeId?: string
}

/** Section tile wrapper — keeps all form sections visually consistent */
function FormTile({
  title,
  children,
  error,
}: {
  title: string
  children: React.ReactNode
  error?: string
}) {
  return (
    <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
      <h2 className="font-display text-xl font-semibold text-espresso mb-4">{title}</h2>
      {error && (
        <p className="mb-3 rounded-[14px] bg-terracotta/10 px-3 py-2 text-sm font-medium text-terracotta">
          {error}
        </p>
      )}
      {children}
    </div>
  )
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
          amount: ri.amount ?? ri.quantity,
          unit: (ri.unit as AmountUnit) ?? 'serving',
        }))
      )
    }
  }, [existingRecipe])

  // Calculate nutrition totals
  const nutrition = useMemo(() => {
    return selectedIngredients.reduce(
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

  const handleAddIngredient = (
    ingredient: Ingredient,
    amount: number,
    unit: AmountUnit
  ) => {
    setSelectedIngredients((prev) => [...prev, { ingredient, amount, unit }])
  }

  const handleRemoveIngredient = (ingredientId: string) => {
    setSelectedIngredients((prev) =>
      prev.filter((si) => si.ingredient.id !== ingredientId)
    )
  }

  const handleUpdateIngredient = (
    ingredientId: string,
    patch: { amount?: number; unit?: AmountUnit }
  ) => {
    setSelectedIngredients((prev) =>
      prev.map((si) =>
        si.ingredient.id === ingredientId ? { ...si, ...patch } : si
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
        amount: si.amount,
        unit: si.unit,
        quantity: servingsEquivalent(si.ingredient, si.amount, si.unit),
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
      <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
        <div className="space-y-4">
          <div className="skeleton h-6 w-1/3 rounded-full" />
          <div className="skeleton h-10 w-full rounded-[14px]" />
          <div className="skeleton h-24 w-full rounded-[14px]" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ── Basic info ──────────────────────────────────────────────── */}
      <FormTile title="Recipe Details">
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
            placeholder="A brief description of your recipe…"
            rows={2}
          />

          {/* Time + servings row */}
          <div className="grid grid-cols-3 gap-3">
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
              label="Prep (min)"
              type="number"
              value={formData.prep_time}
              onChange={(e) =>
                setFormData({ ...formData, prep_time: Number(e.target.value) })
              }
              min={0}
            />
            <Input
              label="Cook (min)"
              type="number"
              value={formData.cook_time}
              onChange={(e) =>
                setFormData({ ...formData, cook_time: Number(e.target.value) })
              }
              min={0}
            />
          </div>
        </div>
      </FormTile>

      {/* ── Ingredients ─────────────────────────────────────────────── */}
      <FormTile title="Ingredients" error={errors.ingredients}>
        <IngredientPicker
          selectedIngredients={selectedIngredients}
          onAdd={handleAddIngredient}
          onRemove={handleRemoveIngredient}
          onUpdate={handleUpdateIngredient}
        />
      </FormTile>

      {/* ── Live nutrition preview ───────────────────────────────────── */}
      {selectedIngredients.length > 0 && (
        <div className="rounded-[28px] bg-gradient-to-br from-emerald/[0.10] to-emerald/[0.04] p-5 ring-1 ring-emerald/20">
          <h2 className="font-display text-xl font-semibold text-espresso mb-4">
            Nutrition <span className="text-espresso/45 text-base font-normal">per serving</span>
          </h2>
          <MacroDisplay
            calories={perServing.calories}
            protein={perServing.protein}
            carbs={perServing.carbs}
            fat={perServing.fat}
            size="lg"
            layout="grid"
          />
        </div>
      )}

      {/* ── Instructions ────────────────────────────────────────────── */}
      <FormTile title="Instructions (optional)">
        <Textarea
          value={formData.instructions}
          onChange={(e) =>
            setFormData({ ...formData, instructions: e.target.value })
          }
          placeholder="Step-by-step cooking instructions…"
          rows={6}
        />
      </FormTile>

      {/* ── Action row ──────────────────────────────────────────────── */}
      <div className="flex gap-3 justify-end pb-2">
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
