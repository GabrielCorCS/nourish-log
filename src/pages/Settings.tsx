import { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { useUserSettings, useUpdateUserSettings } from '@/hooks'
import { useUIStore } from '@/stores'

export function Settings() {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const { data: settings, isLoading } = useUserSettings()
  const updateSettings = useUpdateUserSettings()

  const [goals, setGoals] = useState({
    daily_calorie_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 250,
    daily_fat_goal: 65,
  })

  useEffect(() => {
    if (settings) {
      setGoals({
        daily_calorie_goal: settings.daily_calorie_goal,
        daily_protein_goal: settings.daily_protein_goal,
        daily_carbs_goal: settings.daily_carbs_goal,
        daily_fat_goal: settings.daily_fat_goal,
      })
    }
  }, [settings])

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync(goals)
      addToast('Settings saved successfully', 'success')
    } catch {
      addToast('Failed to save settings', 'error')
    }
  }

  if (isLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading settings..." />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-2xl font-bold text-espresso">
            Settings
          </h1>
        </div>

        {/* Daily Goals */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
            Daily Goals
          </h2>
          <p className="text-sm text-espresso/60 mb-6">
            Set your daily nutrition targets
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Calories (kcal)"
              type="number"
              value={goals.daily_calorie_goal}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  daily_calorie_goal: Number(e.target.value),
                })
              }
              min={0}
            />
            <Input
              label="Protein (g)"
              type="number"
              value={goals.daily_protein_goal}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  daily_protein_goal: Number(e.target.value),
                })
              }
              min={0}
            />
            <Input
              label="Carbohydrates (g)"
              type="number"
              value={goals.daily_carbs_goal}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  daily_carbs_goal: Number(e.target.value),
                })
              }
              min={0}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={goals.daily_fat_goal}
              onChange={(e) =>
                setGoals({
                  ...goals,
                  daily_fat_goal: Number(e.target.value),
                })
              }
              min={0}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-latte flex justify-end">
            <Button
              onClick={handleSave}
              isLoading={updateSettings.isPending}
            >
              Save Changes
            </Button>
          </div>
        </Card>

        {/* About */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
            About
          </h2>
          <div className="space-y-2 text-sm text-espresso/60">
            <p>NourishLog v0.1.0</p>
            <p>A cozy meal tracking app</p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
