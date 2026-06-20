import { useState, useEffect } from 'react'
import { ArrowLeft, UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
import { LoadingState } from '@/components/shared'
import { useUserSettings, useUpdateUserSettings } from '@/hooks'
import { useHousehold } from '@/hooks/useHousehold'
import {
  useUpdateProfile,
  useUpdateHouseholdName,
  useAddPartnerByEmail,
} from '@/hooks/useHouseholdActions'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

export function Settings() {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)
  const { profile, user } = useAuth()

  const { data: settings, isLoading } = useUserSettings()
  const updateSettings = useUpdateUserSettings()

  const { data: household } = useHousehold()
  const updateProfile = useUpdateProfile()
  const updateHouseholdName = useUpdateHouseholdName()
  const addPartner = useAddPartnerByEmail()

  const [goals, setGoals] = useState({
    daily_calorie_goal: 2000,
    daily_protein_goal: 150,
    daily_carbs_goal: 250,
    daily_fat_goal: 65,
  })
  const [profileForm, setProfileForm] = useState({ name: '', avatar_emoji: '👤' })
  const [householdName, setHouseholdName] = useState('')
  const [partnerEmail, setPartnerEmail] = useState('')

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

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name ?? '',
        avatar_emoji: profile.avatar_emoji ?? '👤',
      })
    }
  }, [profile])

  useEffect(() => {
    if (household?.householdName) setHouseholdName(household.householdName)
  }, [household?.householdName])

  const handleSaveGoals = async () => {
    try {
      await updateSettings.mutateAsync(goals)
      addToast('Goals saved', 'success')
    } catch {
      addToast('Failed to save goals', 'error')
    }
  }

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync(profileForm)
      addToast('Profile updated', 'success')
    } catch {
      addToast('Failed to update profile', 'error')
    }
  }

  const handleSaveHouseholdName = async () => {
    if (!household?.householdId) return
    try {
      await updateHouseholdName.mutateAsync({
        householdId: household.householdId,
        name: householdName,
      })
      addToast('Household name saved', 'success')
    } catch {
      addToast('Failed to save household name', 'error')
    }
  }

  const handleAddPartner = async () => {
    const email = partnerEmail.trim()
    if (!email) return
    try {
      await addPartner.mutateAsync(email)
      setPartnerEmail('')
      addToast('Partner linked to your household', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Could not link that email', 'error')
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
          <h1 className="font-heading text-2xl font-bold text-espresso">Settings</h1>
        </div>

        {/* Profile */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
            Your Profile
          </h2>
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-center gap-1">
              <div className="h-16 w-16 rounded-full bg-latte flex items-center justify-center text-3xl">
                {profileForm.avatar_emoji || '👤'}
              </div>
              <Input
                aria-label="Avatar emoji"
                value={profileForm.avatar_emoji}
                onChange={(e) =>
                  setProfileForm({ ...profileForm, avatar_emoji: e.target.value.slice(0, 2) })
                }
                className="w-16 text-center"
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-latte flex justify-end">
            <Button onClick={handleSaveProfile} isLoading={updateProfile.isPending}>
              Save Profile
            </Button>
          </div>
        </Card>

        {/* Household / sharing */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-1">Household</h2>
          <p className="text-sm text-espresso/60 mb-4">
            Recipes and the pantry are shared. You each keep your own daily log, and you can
            see each other's progress and log on each other's behalf.
          </p>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Input
                label="Household name"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              onClick={handleSaveHouseholdName}
              isLoading={updateHouseholdName.isPending}
            >
              Save
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium text-espresso/70">Members</p>
            {(household?.members ?? []).map((m) => (
              <div key={m.id} className="flex items-center gap-3 rounded-input bg-cream px-3 py-2">
                <span className="text-xl">{m.avatar_emoji || '👤'}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-espresso truncate">
                    {m.name}
                    {m.id === user?.id && (
                      <span className="ml-2 text-xs text-espresso/40">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-espresso/50 truncate">{m.email}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-latte">
            <p className="text-sm font-medium text-espresso/70 mb-2">Share access by email</p>
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="partner@email.com"
                  value={partnerEmail}
                  onChange={(e) => setPartnerEmail(e.target.value)}
                />
              </div>
              <Button
                variant="secondary"
                onClick={handleAddPartner}
                isLoading={addPartner.isPending}
                leftIcon={<UserPlus className="h-4 w-4" />}
              >
                Link
              </Button>
            </div>
            <p className="mt-2 text-xs text-espresso/40">
              They need to have signed in to NourishLog at least once first.
            </p>
          </div>
        </Card>

        {/* Daily Goals */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">Daily Goals</h2>
          <p className="text-sm text-espresso/60 mb-6">Set your daily nutrition targets</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Calories (kcal)"
              type="number"
              value={goals.daily_calorie_goal}
              onChange={(e) =>
                setGoals({ ...goals, daily_calorie_goal: Number(e.target.value) })
              }
              min={0}
            />
            <Input
              label="Protein (g)"
              type="number"
              value={goals.daily_protein_goal}
              onChange={(e) =>
                setGoals({ ...goals, daily_protein_goal: Number(e.target.value) })
              }
              min={0}
            />
            <Input
              label="Carbohydrates (g)"
              type="number"
              value={goals.daily_carbs_goal}
              onChange={(e) =>
                setGoals({ ...goals, daily_carbs_goal: Number(e.target.value) })
              }
              min={0}
            />
            <Input
              label="Fat (g)"
              type="number"
              value={goals.daily_fat_goal}
              onChange={(e) =>
                setGoals({ ...goals, daily_fat_goal: Number(e.target.value) })
              }
              min={0}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-latte flex justify-end">
            <Button onClick={handleSaveGoals} isLoading={updateSettings.isPending}>
              Save Changes
            </Button>
          </div>
        </Card>

        {/* Units */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">Units</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-espresso/70">Weight</span>
            <div className="flex rounded-input border border-latte overflow-hidden text-sm">
              {(['lb', 'kg'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={cn(
                    'px-4 py-1.5 transition-colors',
                    (settings?.weight_unit ?? 'lb') === u
                      ? 'bg-caramel/15 text-caramel font-medium'
                      : 'text-espresso/60'
                  )}
                  onClick={async () => {
                    try {
                      await updateSettings.mutateAsync({ weight_unit: u })
                      addToast('Units updated', 'success')
                    } catch {
                      addToast('Failed to update units', 'error')
                    }
                  }}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* About */}
        <Card variant="elevated" padding="lg">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">About</h2>
          <div className="space-y-2 text-sm text-espresso/60">
            <p>NourishLog v0.1.0</p>
            <p>A cozy meal tracking app</p>
          </div>
        </Card>
      </div>
    </PageContainer>
  )
}
