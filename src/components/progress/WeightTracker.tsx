import { useState } from 'react'
import { Scale, Plus } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { format } from 'date-fns'
import { Card, Button, Input } from '@/components/ui'
import { EmptyState } from '@/components/shared'
import { useBodyMetrics, useAddBodyMetric } from '@/hooks/useBodyMetrics'
import { useUserSettings } from '@/hooks'
import { useHousehold } from '@/hooks/useHousehold'
import { useUIStore } from '@/stores'
import { cn } from '@/lib/utils'

const KG_PER_LB = 0.45359237

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
    <Card variant="elevated" padding="lg">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-caramel" />
          <h2 className="font-heading text-lg font-bold text-espresso">Weight</h2>
          {latest != null && (
            <span className="text-sm text-espresso/50">
              · {latest} {unit}
            </span>
          )}
        </div>
        {partner && (
          <div className="flex rounded-input border border-latte overflow-hidden text-xs">
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 transition-colors',
                !subjectId ? 'bg-caramel/15 text-caramel font-medium' : 'text-espresso/60'
              )}
              onClick={() => setSubjectId(undefined)}
            >
              You
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 transition-colors',
                subjectId === partner.id
                  ? 'bg-caramel/15 text-caramel font-medium'
                  : 'text-espresso/60'
              )}
              onClick={() => setSubjectId(partner.id)}
            >
              {partner.avatar_emoji || '👤'} {partner.name}
            </button>
          </div>
        )}
      </div>

      {chartData.length > 0 ? (
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D4C4B0" strokeOpacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#3D3024' }} />
              <YAxis
                domain={['dataMin - 2', 'dataMax + 2']}
                tick={{ fontSize: 11, fill: '#3D3024' }}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="weight"
                stroke="#C8846C"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          icon={<Scale className="h-8 w-8" />}
          title="No weigh-ins yet"
          description="Log a weight to start your chart"
        />
      )}

      <div className="mt-4 flex items-end gap-2">
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
        <Button onClick={handleAdd} isLoading={addMetric.isPending} leftIcon={<Plus className="h-4 w-4" />}>
          Log
        </Button>
      </div>

      <p className="mt-3 text-xs text-espresso/40">
        Smart-scale sync (Renpho) is coming — see RENPHO.md. For now, log manually here.
      </p>
    </Card>
  )
}
