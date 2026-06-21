import { useEffect } from 'react'
import { Plus } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Button } from '@/components/ui'
import {
  TodaySummary,
  MacroTiles,
  MealTimeline,
  StreakCard,
  PartnerSummary,
  QuickAdd,
} from '@/components/dashboard'
import { LogMealModal } from '@/components/logging'
import { useUIStore, useViewStore } from '@/stores'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/dates'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard() {
  const openLogMealModal = useUIStore((state) => state.openLogMealModal)
  const setViewUser = useViewStore((s) => s.setViewUser)
  const { profile } = useAuth()
  const firstName = profile?.name?.trim().split(/\s+/)[0] || 'there'

  // The dashboard is always *your* home — clear any active "viewing partner"
  // state so it never opens showing the other person's day.
  useEffect(() => {
    setViewUser(null)
  }, [setViewUser])

  return (
    <PageContainer>
      {/* Greeting */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-espresso/55">
            {formatDate(new Date(), 'EEEE, MMMM d')}
          </p>
          <h1 className="font-display text-display font-semibold text-espresso">
            {getGreeting()}, {firstName}
          </h1>
        </div>
        <Button
          onClick={openLogMealModal}
          leftIcon={<Plus className="h-4 w-4" />}
          className="hidden shrink-0 sm:inline-flex"
        >
          Log meal
        </Button>
      </div>

      {/* Bento grid — asymmetric tiles, calorie hero leads */}
      <div className="stagger grid auto-rows-auto grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Hero: big block, left two columns over two rows on desktop */}
        <div className="col-span-2 lg:col-span-2 lg:row-span-2">
          <TodaySummary />
        </div>

        {/* Three macro tiles + streak fill the 2×2 to the hero's right */}
        <MacroTiles />
        <StreakCard />

        {/* Secondary row — these self-place and return null when empty,
            so they carry their own col-span (no empty wrapper cells) */}
        <PartnerSummary />
        <QuickAdd />

        {/* Full-width meal timeline */}
        <div className="col-span-2 lg:col-span-4">
          <MealTimeline />
        </div>
      </div>

      <LogMealModal />
    </PageContainer>
  )
}
