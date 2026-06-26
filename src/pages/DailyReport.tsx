import { useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ArrowLeft, UtensilsCrossed } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { LoadingState } from '@/components/shared'
import { MealCard } from '@/components/journal/MealCard'
import { useDailyReport, type MemberReport } from '@/hooks/useDailyReport'
import { MEAL_TYPES } from '@/lib/constants'
import { parseISO, toISODateString, formatDate, addDays, subDays, isToday } from '@/lib/dates'
import type { FoodEntryWithDetails, MealType } from '@/types/database'
import { cn } from '@/lib/utils'

const MACROS = [
  { key: 'calories', label: 'Calories', unit: '', color: '#F97316', track: 'bg-terracotta/15' },
  { key: 'protein', label: 'Protein', unit: 'g', color: '#16A34A', track: 'bg-emerald/15' },
  { key: 'carbs', label: 'Carbs', unit: 'g', color: '#F5B53F', track: 'bg-honey/20' },
  { key: 'fat', label: 'Fat', unit: 'g', color: '#EC8C9C', track: 'bg-blush/20' },
] as const

function MacroStat({
  label,
  unit,
  value,
  goal,
  color,
  track,
}: {
  label: string
  unit: string
  value: number
  goal: number
  color: string
  track: string
}) {
  const pct = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0
  const over = goal > 0 && value > goal
  const remaining = Math.max(0, Math.round(goal - value))
  return (
    <div className="rounded-[18px] bg-cream/70 p-3.5 ring-1 ring-latte/50">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">{label}</span>
        <span className="metric text-xs font-semibold text-espresso/45">{pct}%</span>
      </div>
      <p className="metric mt-1 text-espresso">
        <span className="text-lg font-bold">{Math.round(value).toLocaleString()}</span>
        <span className="text-xs text-espresso/45"> / {Math.round(goal).toLocaleString()}{unit}</span>
      </p>
      <div className={cn('mt-2 h-2 overflow-hidden rounded-full', track)}>
        <div
          className="h-2 rounded-full transition-all"
          style={{ width: `${pct}%`, background: over ? '#F97316' : color }}
        />
      </div>
      <p className="mt-1.5 text-[11px] font-medium text-espresso/45">
        {over ? (
          <span className="text-terracotta">{Math.round(value - goal).toLocaleString()}{unit} over</span>
        ) : (
          <>{remaining.toLocaleString()}{unit} to go</>
        )}
      </p>
    </div>
  )
}

function groupByMeal(entries: FoodEntryWithDetails[]) {
  return entries.reduce(
    (acc, e) => {
      const list = (acc[e.meal_type] ??= [])
      list.push(e)
      return acc
    },
    {} as Record<MealType, FoodEntryWithDetails[]>,
  )
}

function MemberSection({ report }: { report: MemberReport }) {
  const grouped = groupByMeal(report.entries)
  const calPct = report.goals.calories > 0
    ? Math.round((report.totals.calories / report.goals.calories) * 100)
    : 0

  return (
    <section className="overflow-hidden rounded-[28px] bg-warm-white ring-1 ring-latte/60">
      {/* Member header */}
      <div className="flex items-center gap-3 bg-gradient-to-br from-[#173B25] to-[#0d2417] px-5 py-4 text-white">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/15">
          {report.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold leading-tight">{report.name}'s Report</h2>
          <p className="text-xs text-white/65">
            {report.entries.length} {report.entries.length === 1 ? 'item' : 'items'} · {calPct}% of calorie goal
          </p>
        </div>
        {report.weight && (
          <div className="text-right">
            <p className="metric text-base font-bold leading-none">
              {report.weight.value.toFixed(1)}
              <span className="text-xs font-medium text-white/60"> {report.weight.unit}</span>
            </p>
            {report.weight.delta !== null && (
              <p className={cn(
                'mt-0.5 text-[11px] font-semibold',
                report.weight.delta > 0 ? 'text-honey' : 'text-lime',
              )}>
                {report.weight.delta > 0 ? '▲' : '▼'} {Math.abs(report.weight.delta).toFixed(1)} {report.weight.unit}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Macros */}
      <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-4">
        {MACROS.map((m) => (
          <MacroStat
            key={m.key}
            label={m.label}
            unit={m.unit}
            value={report.totals[m.key]}
            goal={report.goals[m.key]}
            color={m.color}
            track={m.track}
          />
        ))}
      </div>

      {/* Meals */}
      <div className="space-y-4 px-4 pb-5">
        {report.entries.length === 0 ? (
          <div className="flex items-center gap-2.5 rounded-[18px] bg-cream/70 px-4 py-5 text-sm text-espresso/50 ring-1 ring-latte/50">
            <UtensilsCrossed className="h-4 w-4" /> Nothing logged this day.
          </div>
        ) : (
          MEAL_TYPES.map((mt) => {
            const items = grouped[mt.value]
            if (!items || items.length === 0) return null
            const cals = Math.round(items.reduce((s, e) => s + e.calories, 0))
            return (
              <div key={mt.value}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-base">{mt.emoji}</span>
                  <h3 className="font-display text-sm font-semibold text-espresso">{mt.label}</h3>
                  <span className="metric ml-auto text-xs font-semibold text-espresso/45">{cals} kcal</span>
                </div>
                <div className="space-y-2">
                  {items.map((e) => (
                    <MealCard key={e.id} entry={e} />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </section>
  )
}

export function DailyReport() {
  const { date: dateParam } = useParams<{ date?: string }>()
  const navigate = useNavigate()

  const date = useMemo(() => {
    if (dateParam) {
      const d = parseISO(dateParam)
      if (!Number.isNaN(d.getTime())) return d
    }
    return new Date()
  }, [dateParam])

  const { data: reports, isLoading } = useDailyReport(date)

  const go = (d: Date) => navigate(`/report/${toISODateString(d)}`)

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-espresso/55 transition-colors hover:text-espresso"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">📊 Daily Report</p>
            <h1 className="font-display text-display font-semibold text-espresso">
              {isToday(date) ? 'Today' : formatDate(date, 'EEEE, MMM d')}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label="Previous day"
              onClick={() => go(subDays(date, 1))}
              className="grid h-9 w-9 place-items-center rounded-full bg-warm-white text-espresso/60 ring-1 ring-latte/60 transition-colors hover:text-espresso"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next day"
              disabled={isToday(date)}
              onClick={() => go(addDays(date, 1))}
              className="grid h-9 w-9 place-items-center rounded-full bg-warm-white text-espresso/60 ring-1 ring-latte/60 transition-colors hover:text-espresso disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <LoadingState message="Building your report…" />
      ) : (
        <div className="space-y-5">
          {(reports ?? []).map((r) => (
            <MemberSection key={r.userId} report={r} />
          ))}
        </div>
      )}
    </PageContainer>
  )
}
