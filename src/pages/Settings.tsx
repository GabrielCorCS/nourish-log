import { useState, useEffect } from 'react'
import { UserPlus, Target, Home, Scale, Info, User } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button, Input } from '@/components/ui'
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

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/12 text-emerald-dark">
        {icon}
      </span>
      <h2 className="font-display text-lg font-semibold leading-none text-espresso">{label}</h2>
    </div>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────
function Divider() {
  return <div className="my-4 h-px bg-latte/60" />
}

export function Settings() {
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
        <LoadingState message="Loading settings…" />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="space-y-5">

        {/* ── Page hero ───────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-6 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.4), transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full opacity-35 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.35), transparent 70%)' }}
          />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-lime/90">
              Your kitchen
            </span>
            <h1 className="mt-1 font-display text-title font-semibold text-white">
              Settings
            </h1>
            <p className="mt-1.5 text-sm text-white/65">
              Profile, goals &amp; household preferences.
            </p>
          </div>
        </div>

        {/* ── Profile tile ────────────────────────────────────────────── */}
        <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
          <SectionHeader icon={<User className="h-4 w-4" />} label="Your profile" />

          <div className="flex items-end gap-4">
            {/* Avatar preview + emoji input */}
            <div className="flex flex-col items-center gap-2">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-sage/25 to-emerald/10 text-3xl ring-1 ring-emerald/15">
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

          {profile?.email && (
            <p className="mt-3 text-xs text-espresso/40">{profile.email}</p>
          )}

          <Divider />
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} isLoading={updateProfile.isPending}>
              Save profile
            </Button>
          </div>
        </div>

        {/* ── Daily goals tile ─────────────────────────────────────────── */}
        <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
          <SectionHeader icon={<Target className="h-4 w-4" />} label="Daily goals" />
          <p className="mb-5 text-sm text-espresso/55">Set your daily nutrition targets.</p>

          {/* Calorie goal — accent tile */}
          <div className="mb-4 rounded-[22px] bg-gradient-to-br from-terracotta/[0.12] to-terracotta/[0.04] p-4 ring-1 ring-terracotta/20">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
              Calories
            </p>
            <div className="flex items-end gap-3">
              <Input
                type="number"
                value={goals.daily_calorie_goal}
                onChange={(e) =>
                  setGoals({ ...goals, daily_calorie_goal: Number(e.target.value) })
                }
                min={0}
                className="flex-1"
              />
              <span className="mb-2 text-sm font-medium text-espresso/55">kcal / day</span>
            </div>
          </div>

          {/* Macro goals grid */}
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Protein */}
            <div className="rounded-[22px] bg-gradient-to-br from-emerald/[0.10] to-emerald/[0.03] p-4 ring-1 ring-emerald/15">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Protein
              </p>
              <div className="flex items-end gap-2">
                <Input
                  type="number"
                  value={goals.daily_protein_goal}
                  onChange={(e) =>
                    setGoals({ ...goals, daily_protein_goal: Number(e.target.value) })
                  }
                  min={0}
                  className="flex-1"
                />
                <span className="mb-2 text-xs font-medium text-espresso/45">g</span>
              </div>
            </div>

            {/* Carbs */}
            <div className="rounded-[22px] bg-gradient-to-br from-honey/[0.14] to-honey/[0.04] p-4 ring-1 ring-honey/20">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Carbs
              </p>
              <div className="flex items-end gap-2">
                <Input
                  type="number"
                  value={goals.daily_carbs_goal}
                  onChange={(e) =>
                    setGoals({ ...goals, daily_carbs_goal: Number(e.target.value) })
                  }
                  min={0}
                  className="flex-1"
                />
                <span className="mb-2 text-xs font-medium text-espresso/45">g</span>
              </div>
            </div>

            {/* Fat */}
            <div className="rounded-[22px] bg-gradient-to-br from-blush/[0.12] to-blush/[0.03] p-4 ring-1 ring-blush/15">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Fat
              </p>
              <div className="flex items-end gap-2">
                <Input
                  type="number"
                  value={goals.daily_fat_goal}
                  onChange={(e) =>
                    setGoals({ ...goals, daily_fat_goal: Number(e.target.value) })
                  }
                  min={0}
                  className="flex-1"
                />
                <span className="mb-2 text-xs font-medium text-espresso/45">g</span>
              </div>
            </div>
          </div>

          <Divider />
          <div className="flex justify-end">
            <Button onClick={handleSaveGoals} isLoading={updateSettings.isPending}>
              Save goals
            </Button>
          </div>
        </div>

        {/* ── Household tile ───────────────────────────────────────────── */}
        <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
          <SectionHeader icon={<Home className="h-4 w-4" />} label="Household" />
          <p className="mb-4 text-sm text-espresso/55">
            Recipes and the pantry are shared. You each keep your own daily log, and you can see
            each other's progress and log on each other's behalf.
          </p>

          {/* Household name */}
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

          {/* Members list */}
          {(household?.members ?? []).length > 0 && (
            <>
              <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-espresso/55">
                Members
              </p>
              <ul className="stagger space-y-2">
                {(household?.members ?? []).map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-3 rounded-[22px] bg-cream px-4 py-3 ring-1 ring-latte/40"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sage/25 to-emerald/10 text-xl ring-1 ring-emerald/15">
                      {m.avatar_emoji || '👤'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-espresso">
                        {m.name}
                        {m.id === user?.id && (
                          <span className="ml-2 text-xs text-espresso/40">(you)</span>
                        )}
                      </p>
                      <p className="truncate text-xs text-espresso/45">{m.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Link partner */}
          <Divider />
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-espresso/55">
            Share access by email
          </p>
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

        {/* ── Units tile ───────────────────────────────────────────────── */}
        <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
          <SectionHeader icon={<Scale className="h-4 w-4" />} label="Units" />
          <div className="flex items-center gap-3">
            <span className="text-sm text-espresso/70">Weight</span>
            <div className="flex overflow-hidden rounded-[12px] border border-latte text-sm">
              {(['lb', 'kg'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  className={cn(
                    'pressable px-5 py-2 transition-colors',
                    (settings?.weight_unit ?? 'lb') === u
                      ? 'bg-emerald/15 font-semibold text-emerald-dark'
                      : 'text-espresso/55 hover:bg-cream'
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
        </div>

        {/* ── About tile ───────────────────────────────────────────────── */}
        <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
          <SectionHeader icon={<Info className="h-4 w-4" />} label="About" />
          <div className="space-y-1 text-sm text-espresso/55">
            <p className="font-medium text-espresso">NourishLog v0.1.0</p>
            <p>A cozy meal tracking app for two.</p>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
