import { useState } from 'react'
import { Scale, Plus } from 'lucide-react'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from 'recharts'
import { format } from 'date-fns'
import { Button, Input } from '@/components/ui'
import { EmptyState } from '@/components/shared'
import { useBodyMetrics, useAddBodyMetric } from '@/hooks/useBodyMetrics'
import { useUserSettings } from '@/hooks'
import { useHousehold } from '@/hooks/useHousehold'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'
import type { TooltipProps } from 'recharts'

const KG_PER_LB = 0.45359237

function ChartTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-[16px] bg-warm-white px-3.5 py-2.5 ring-1 ring-latte/60 shadow-soft">
      <p className="text-xs font-bold uppercase tracking-wide text-espresso/55 mb-0.5">{label}</p>
      <p className="metric text-lg font-bold text-espresso">
        {payload[0]?.value}
      </p>
    </div>
  )
}

export function WeightTracker() {
  const addToast = useUIStore((s) => s.addToast)
  const { data: settings } = useUserSettings()
  const unit = settings?.weight_unit === 'kg' ? 'kg' : 'lb'
  const { data: household } = useHousehold()
  const partner = household?.partner ?? null

  const [subjectId, setSubjectId] = useState<string | undefined>(undefined) // undefined = me
  const { data: metrics } = useBodyMetrics(subjectId)
  const addMetric = useAddBodyMetric()

  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')

  const toDisplay = (kg: number) => (unit === 'lb' ? kg / KG_PER_LB : kg)
  const toKg = (val: number) => (unit === 'lb' ? val * KG_PER_LB : val)

  const chartData = (metrics ?? [])
    .filter((m) => m.weight_kg != null)
    .map((m) => ({
      date: format(new Date(m.measured_at), 'MMM d'),
      weight: Math.round(toDisplay(m.weight_kg as number) * 10) / 10,
    }))

  const latest = chartData.length ? chartData[chartData.length - 1].weight : null

  const handleAdd = async () => {
    const w = parseFloat(weight)
    if (!w || w <= 0) return
    try {
      await addMetric.mutateAsync({
        user_id: subjectId,
        weight_kg: toKg(w),
        body_fat_pct: bodyFat ? parseFloat(bodyFat) : null,
        source: 'manual',
      })
      setWeight('')
      setBodyFat('')
      addToast('Weigh-in logged', 'success')
    } catch {
      addToast('Failed to log weigh-in', 'error')
    }
  }

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-warm-white ring-1 ring-latte/60 p-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/12 text-emerald-dark">
            <Scale className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-espresso/55">Body weight</p>
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-title font-semibold leading-tight text-espresso">
                Weight
              </h2>
              {latest != null && (
                <span className="metric text-sm font-semibold text-espresso/55">
                  {latest} {unit}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Partner switcher */}
        {partner && (
          <div className="flex overflow-hidden rounded-full border border-latte text-xs">
            <button
              type="button"
              className={cn(
                'pressable px-3 py-1.5 transition-colors font-medium',
                !subjectId
                  ? 'bg-emerald text-white'
                  : 'text-espresso/60 hover:text-espresso'
              )}
              onClick={() => setSubjectId(undefined)}
            >
              You
            </button>
            <button
              type="button"
              className={cn(
                'pressable px-3 py-1.5 transition-colors font-medium',
                subjectId === partner.id
                  ? 'bg-emerald text-white'
                  : 'text-espresso/60 hover:text-espresso'
              )}
              onClick={() => setSubjectId(partner.id)}
            >
              {partner.avatar_emoji || '👤'} {partner.name}
            </button>
          </div>
        )}
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#D6E8D8" strokeOpacity={0.8} vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#14331F', fillOpacity: 0.45, fontWeight: 600 }}
              />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#14331F', fillOpacity: 0.45 }}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#16A34A"
                strokeWidth={2.5}
                fill="url(#weightGradient)"
                dot={{ r: 3, fill: '#16A34A', strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#0F7A38', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            icon={<Scale className="h-8 w-8" />}
            title="No weigh-ins yet"
            description="Log a weight to start your chart"
          />
        </div>
      )}

      {/* Log form */}
      <div className="mt-5 flex items-end gap-2">
        <div className="flex-1">
          <Input
            label={`Weight (${unit})`}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
            min={0}
          />
        </div>
        <div className="flex-1">
          <Input
            label="Body fat % (optional)"
            type="number"
            value={bodyFat}
            onChange={(e) => setBodyFat(e.target.value)}
            placeholder="—"
            min={0}
          />
        </div>
        <Button
          onClick={handleAdd}
          isLoading={addMetric.isPending}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Log
        </Button>
      </div>

      <p className="mt-3 text-xs text-espresso/40">
        Smart-scale sync (Renpho) coming soon. Log manually for now.
      </p>
    </div>
  )
}
