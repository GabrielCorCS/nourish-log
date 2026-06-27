import { useState, useMemo } from 'react'
import { DollarSign, Store, CreditCard, Plus, Trash2 } from 'lucide-react'
import { Select, Button } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import { ExpenseForm } from './ExpenseForm'
import {
  useGroceryPurchases,
  useDeleteGroceryPurchase,
  calculateSpendingByStore,
  calculateSpendingByCard,
  calculateTotalSpending,
} from '@/hooks'
import { PAYMENT_CARDS, type SpendingKind } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/dates'
import { startOfWeek, startOfMonth, startOfYear, subMonths } from 'date-fns'

type TimePeriod = 'week' | 'month' | '3months' | '6months' | 'year' | 'all'

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: 'year', label: 'This Year' },
  { value: 'all', label: 'All Time' },
]

type KindFilter = 'all' | SpendingKind
const KIND_FILTERS: { value: KindFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'grocery', label: 'Groceries' },
  { value: 'other', label: 'Other' },
]

function getDateRange(period: TimePeriod): { start: Date; end: Date } | undefined {
  const now = new Date()
  switch (period) {
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now }
    case 'month':
      return { start: startOfMonth(now), end: now }
    case '3months':
      return { start: subMonths(now, 3), end: now }
    case '6months':
      return { start: subMonths(now, 6), end: now }
    case 'year':
      return { start: startOfYear(now), end: now }
    case 'all':
      return undefined
  }
}

const cardById = (id: string | null) => PAYMENT_CARDS.find((c) => c.id === id)

export function SpendingOverview() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')
  const [kindFilter, setKindFilter] = useState<KindFilter>('all')
  const [formKind, setFormKind] = useState<SpendingKind | null>(null)

  // Memoize on timePeriod so the range (and the React Query key derived from it)
  // is stable across renders. getDateRange calls new Date() for `end`/`start`, so
  // computing it inline made the query key change every render — an infinite
  // refetch loop that never left the loading state.
  const dateRange = useMemo(() => getDateRange(timePeriod), [timePeriod])
  const { data: purchases, isLoading } = useGroceryPurchases(
    dateRange,
    kindFilter === 'all' ? undefined : kindFilter
  )
  const deletePurchase = useDeleteGroceryPurchase()

  const analytics = useMemo(() => {
    if (!purchases) return null
    return {
      total: calculateTotalSpending(purchases),
      byStore: calculateSpendingByStore(purchases).sort((a, b) => b.total - a.total),
      byCard: calculateSpendingByCard(purchases).sort((a, b) => b.total - a.total),
      count: purchases.length,
    }
  }, [purchases])

  return (
    <div className="space-y-5">
      {/* Log actions */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="accent"
          onClick={() => setFormKind('grocery')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Grocery purchase
        </Button>
        <Button
          variant="outline"
          onClick={() => setFormKind('other')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Other expense
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-full bg-cream p-1 ring-1 ring-latte/50">
          {KIND_FILTERS.map((k) => (
            <button
              key={k.value}
              type="button"
              onClick={() => setKindFilter(k.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors',
                kindFilter === k.value
                  ? 'bg-warm-white text-espresso shadow-soft ring-1 ring-latte/60'
                  : 'text-espresso/55 hover:text-espresso'
              )}
            >
              {k.label}
            </button>
          ))}
        </div>
        <Select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          options={TIME_PERIODS}
          className="w-44"
        />
      </div>

      {isLoading ? (
        <LoadingState message="Loading spending data..." />
      ) : !analytics || analytics.count === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-8 w-8" />}
          title="No spending logged"
          description="Use the buttons above to log a grocery purchase or other expense."
        />
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="relative col-span-2 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-6 text-white lg:col-span-2">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-55 blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.4), transparent 70%)' }}
              />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime/90">
                  Total Spent
                </p>
                <span className="mt-2 block font-display text-[3.5rem] font-semibold leading-[0.9] tracking-tight text-white sm:text-[4.5rem]">
                  ${analytics.total.toFixed(2)}
                </span>
                <p className="metric mt-2 text-sm font-medium text-white/60">
                  {analytics.count} entr{analytics.count !== 1 ? 'ies' : 'y'}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] p-4 ring-1 ring-emerald/20">
              <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">Entries</span>
              <span className="metric mt-3 text-3xl font-bold leading-none text-espresso">
                {analytics.count}
              </span>
            </div>

            <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] p-4 ring-1 ring-honey/30">
              <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">Avg</span>
              <span className="metric mt-3 text-3xl font-bold leading-none text-espresso">
                ${(analytics.total / analytics.count).toFixed(2)}
              </span>
            </div>
          </div>

          {/* By store */}
          <div className="rounded-[22px] bg-warm-white p-5 ring-1 ring-latte/60">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/10 text-emerald-dark">
                <Store className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-semibold text-espresso">By Store</h3>
            </div>
            <div className="space-y-3">
              {analytics.byStore.map((s) => (
                <div key={s.storeId || 'unknown'} className="flex items-center gap-3">
                  <span className="text-xl leading-none">{s.storeEmoji || '🏪'}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between">
                      <p className="truncate font-semibold text-espresso">{s.storeName}</p>
                      <p className="metric ml-3 shrink-0 font-bold text-espresso">
                        ${s.total.toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-latte/50">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#34D27B] to-emerald"
                        style={{ width: `${(s.total / analytics.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By card */}
          <div className="rounded-[22px] bg-warm-white p-5 ring-1 ring-latte/60">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-honey/15 text-[#A9791B]">
                <CreditCard className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-semibold text-espresso">By Card</h3>
            </div>
            <div className="space-y-3">
              {analytics.byCard.map((c) => {
                const card = cardById(c.card)
                return (
                  <div key={c.card || 'none'} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'h-6 w-9 shrink-0 rounded-[5px] bg-gradient-to-br ring-1 ring-black/10',
                        card?.gradient ?? 'from-latte to-latte'
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <p className="truncate font-semibold text-espresso">
                          {card?.label ?? 'No card'}
                        </p>
                        <p className="metric ml-3 shrink-0 font-bold text-espresso">
                          ${c.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-latte/50">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-citrus to-honey"
                          style={{ width: `${(c.total / analytics.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Ledger */}
          <div className="rounded-[22px] bg-warm-white p-5 ring-1 ring-latte/60">
            <h3 className="mb-4 font-display text-lg font-semibold text-espresso">Ledger</h3>
            <ul className="space-y-2">
              {purchases!.map((p) => {
                const card = cardById(p.card)
                return (
                  <li
                    key={p.id}
                    className="flex items-center gap-3 rounded-[16px] bg-cream px-3.5 py-3 ring-1 ring-latte/40"
                  >
                    <span className="text-xl leading-none">{p.store?.emoji || '🏪'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-espresso">
                        {p.store?.name || 'Unknown store'}
                        {p.notes && (
                          <span className="font-normal text-espresso/50"> · {p.notes}</span>
                        )}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="metric text-xs text-espresso/45">
                          {formatDate(p.purchased_at, 'MMM d')}
                        </span>
                        {card && (
                          <span
                            className={cn(
                              'rounded-full bg-gradient-to-br px-2 py-0.5 text-[10px] font-bold',
                              card.gradient,
                              card.text
                            )}
                          >
                            {card.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="metric shrink-0 font-bold text-espresso">
                      ${p.price.toFixed(2)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-espresso/30 hover:bg-terracotta/10 hover:text-terracotta"
                      onClick={() => deletePurchase.mutate(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}

      {formKind && <ExpenseForm kind={formKind} onClose={() => setFormKind(null)} />}
    </div>
  )
}
