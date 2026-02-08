import { useState, useMemo } from 'react'
import { DollarSign, TrendingUp, Store, Package } from 'lucide-react'
import { Card, Select } from '@/components/ui'
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
    <div className="space-y-6">
      {/* Time Period Selector */}
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
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card variant="elevated" padding="lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-sage/20">
                  <DollarSign className="h-6 w-6 text-sage" />
                </div>
                <div>
                  <p className="text-sm text-espresso/60">Total Spent</p>
                  <p className="text-2xl font-bold text-espresso">
                    ${analytics.totalSpending.toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-honey/20">
                  <Package className="h-6 w-6 text-honey" />
                </div>
                <div>
                  <p className="text-sm text-espresso/60">Purchases</p>
                  <p className="text-2xl font-bold text-espresso">
                    {analytics.purchaseCount}
                  </p>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blush/20">
                  <TrendingUp className="h-6 w-6 text-blush" />
                </div>
                <div>
                  <p className="text-sm text-espresso/60">Avg per Purchase</p>
                  <p className="text-2xl font-bold text-espresso">
                    ${(analytics.totalSpending / analytics.purchaseCount).toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Spending by Store */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Store className="h-5 w-5 text-espresso" />
              <h3 className="text-lg font-semibold text-espresso">By Store</h3>
            </div>
            {analytics.byStore.length === 0 ? (
              <p className="text-sm text-espresso/50">No store data available</p>
            ) : (
              <div className="space-y-3">
                {analytics.byStore.map((store) => (
                  <div key={store.storeId || 'unknown'} className="flex items-center gap-3">
                    <span className="text-xl">{store.storeEmoji || '🏪'}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="font-medium text-espresso truncate">
                          {store.storeName}
                        </p>
                        <p className="font-semibold text-espresso">
                          ${store.total.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-1 h-2 bg-latte rounded-full overflow-hidden">
                        <div
                          className="h-full bg-caramel rounded-full"
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
          </Card>

          {/* Spending by Category */}
          <Card variant="elevated" padding="lg">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-espresso" />
              <h3 className="text-lg font-semibold text-espresso">By Category</h3>
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
                      <span className="text-xl">{categoryInfo?.emoji || '📦'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline">
                          <p className="font-medium text-espresso truncate">
                            {categoryInfo?.label || cat.category}
                          </p>
                          <p className="font-semibold text-espresso">
                            ${cat.total.toFixed(2)}
                          </p>
                        </div>
                        <div className="mt-1 h-2 bg-latte rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sage rounded-full"
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
          </Card>
        </>
      )}
    </div>
  )
}
