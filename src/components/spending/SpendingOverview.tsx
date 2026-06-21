import { useState, useMemo } from 'react'
import { DollarSign, TrendingUp, Store, Package } from 'lucide-react'
import { Select } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import {
  useGroceryPurchases,
  calculateSpendingByCategory,
  calculateSpendingByStore,
  calculateTotalSpending,
} from '@/hooks'
import { INGREDIENT_CATEGORIES } from '@/lib/constants'
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

function getDateRange(period: TimePeriod): { start: Date; end: Date } | undefined {
  const now = new Date()
  const end = now

  switch (period) {
    case 'week':
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end }
    case 'month':
      return { start: startOfMonth(now), end }
    case '3months':
      return { start: subMonths(now, 3), end }
    case '6months':
      return { start: subMonths(now, 6), end }
    case 'year':
      return { start: startOfYear(now), end }
    case 'all':
      return undefined
  }
}

export function SpendingOverview() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')
  const dateRange = getDateRange(timePeriod)

  const { data: purchases, isLoading } = useGroceryPurchases(dateRange)

  const analytics = useMemo(() => {
    if (!purchases) return null

    const totalSpending = calculateTotalSpending(purchases)
    const byCategory = calculateSpendingByCategory(purchases)
    const byStore = calculateSpendingByStore(purchases)

    return {
      totalSpending,
      byCategory: byCategory.sort((a, b) => b.total - a.total),
      byStore: byStore.sort((a, b) => b.total - a.total),
      purchaseCount: purchases.length,
    }
  }, [purchases])

  if (isLoading) {
    return <LoadingState message="Loading spending data..." />
  }

  return (
    <div className="space-y-5">
      {/* Time period selector */}
      <div className="flex justify-end">
        <Select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
          options={TIME_PERIODS}
          className="w-48"
        />
      </div>

      {!analytics || analytics.purchaseCount === 0 ? (
        <EmptyState
          icon={<DollarSign className="h-8 w-8" />}
          title="No purchases yet"
          description="Log your grocery purchases to see spending analytics"
        />
      ) : (
        <>
          {/* Bento summary — dark hero total + two color-blocked stat tiles */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* Hero: total spending */}
            <div className="relative col-span-2 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-6 text-white lg:col-span-2">
              {/* Glows */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-55 blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.4), transparent 70%)' }}
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -left-8 h-44 w-44 rounded-full opacity-35 blur-3xl"
                style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.35), transparent 70%)' }}
              />
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime/90">
                  Total Spent
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-display text-[3.5rem] font-semibold leading-[0.9] tracking-tight text-white sm:text-[4.5rem]">
                    ${analytics.totalSpending.toFixed(2)}
                  </span>
                </div>
                <p className="metric mt-2 text-sm font-medium text-white/60">
                  {analytics.purchaseCount} purchase{analytics.purchaseCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Stat: purchases count */}
            <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-emerald/[0.12] to-emerald/[0.04] p-4 ring-1 ring-emerald/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                  Trips
                </span>
                <Package className="h-4 w-4 text-emerald-dark" />
              </div>
              <div className="metric mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold leading-none text-espresso">
                  {analytics.purchaseCount}
                </span>
              </div>
            </div>

            {/* Stat: avg per purchase */}
            <div className="flex flex-col justify-between rounded-[22px] bg-gradient-to-br from-honey/[0.18] to-honey/[0.06] p-4 ring-1 ring-honey/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-espresso/55">
                  Avg / trip
                </span>
                <TrendingUp className="h-4 w-4 text-[#A9791B]" />
              </div>
              <div className="metric mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-bold leading-none text-espresso">
                  ${(analytics.totalSpending / analytics.purchaseCount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* By Store */}
          <div className="rounded-[22px] bg-warm-white p-5 ring-1 ring-latte/60">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/10 text-emerald-dark">
                <Store className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-semibold text-espresso">By Store</h3>
            </div>

            {analytics.byStore.length === 0 ? (
              <p className="text-sm text-espresso/50">No store data available</p>
            ) : (
              <div className="space-y-3">
                {analytics.byStore.map((store) => (
                  <div key={store.storeId || 'unknown'} className="flex items-center gap-3">
                    <span className="text-xl leading-none">{store.storeEmoji || '🏪'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between">
                        <p className="truncate font-semibold text-espresso">
                          {store.storeName}
                        </p>
                        <p className="metric ml-3 shrink-0 font-bold text-espresso">
                          ${store.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-latte/50">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#34D27B] to-emerald transition-[width] duration-700 ease-spring"
                          style={{
                            width: `${(store.total / analytics.totalSpending) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By Category */}
          <div className="rounded-[22px] bg-warm-white p-5 ring-1 ring-latte/60">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-xl bg-honey/15 text-[#A9791B]">
                <Package className="h-4 w-4" />
              </div>
              <h3 className="font-display text-lg font-semibold text-espresso">By Category</h3>
            </div>

            {analytics.byCategory.length === 0 ? (
              <p className="text-sm text-espresso/50">No category data available</p>
            ) : (
              <div className="space-y-3">
                {analytics.byCategory.map((cat) => {
                  const categoryInfo = INGREDIENT_CATEGORIES.find(
                    (c) => c.value === cat.category
                  )
                  return (
                    <div key={cat.category} className="flex items-center gap-3">
                      <span className="text-xl leading-none">{categoryInfo?.emoji || '📦'}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between">
                          <p className="truncate font-semibold text-espresso">
                            {categoryInfo?.label || cat.category}
                          </p>
                          <p className="metric ml-3 shrink-0 font-bold text-espresso">
                            ${cat.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-latte/50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-citrus to-honey transition-[width] duration-700 ease-spring"
                            style={{
                              width: `${(cat.total / analytics.totalSpending) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
