import { Plus, ChefHat, Apple } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { useUIStore } from '@/stores'

export function QuickActions() {
  const navigate = useNavigate()
  const openLogMealModal = useUIStore((state) => state.openLogMealModal)

  return (
    <Card variant="elevated" padding="md">
      <h3 className="font-heading text-lg font-semibold text-espresso mb-4">
        Quick Actions
      </h3>
      <div className="space-y-2">
        <Button
          variant="primary"
          className="w-full justify-start gap-3"
          onClick={openLogMealModal}
        >
          <Plus className="h-5 w-5" />
          Log a Meal
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-start gap-3"
          onClick={() => navigate('/recipes/new')}
        >
          <ChefHat className="h-5 w-5" />
          Create Recipe
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-start gap-3"
          onClick={() => navigate('/pantry')}
        >
          <Apple className="h-5 w-5" />
          Add Ingredient
        </Button>
      </div>
    </Card>
  )
}
