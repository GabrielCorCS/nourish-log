import { useId } from 'react'
import { cn } from '@/lib/utils'
import { calculatePercentage } from '@/lib/utils'

interface NutritionRingProps {
  value: number
  max: number
  label: string
  color: 'calories' | 'protein' | 'carbs' | 'fat'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showValue?: boolean
  unit?: string
  className?: string
}

// Each macro gets a soft two-stop gradient for a premium, dimensional ring.
const GRADIENTS: Record<NutritionRingProps['color'], [string, string]> = {
  calories: ['#FB923C', '#F97316'],
  protein: ['#34D27B', '#16A34A'],
  carbs: ['#F8CE5B', '#F2B53B'],
  fat: ['#F9A8D4', '#F472A6'],
}

export function NutritionRing({
  value,
  max,
  label,
  color,
  size = 'md',
  showValue = true,
  unit,
  className,
}: NutritionRingProps) {
  const gradientId = useId()
  const percentage = calculatePercentage(value, max)
  const isOver = value > max

  const sizes = {
    sm: { ring: 60, stroke: 5, value: 'text-sm', label: 'text-[11px]' },
    md: { ring: 84, stroke: 7, value: 'text-lg', label: 'text-xs' },
    lg: { ring: 132, stroke: 11, value: 'text-3xl', label: 'text-sm' },
    xl: { ring: 168, stroke: 13, value: 'text-[2.75rem]', label: 'text-sm' },
  }

  const s = sizes[size]
  const radius = (s.ring - s.stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference
  const [from, to] = GRADIENTS[color]

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg className="nutrition-ring" width={s.ring} height={s.ring}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={from} />
              <stop offset="100%" stopColor={to} />
            </linearGradient>
          </defs>
          {/* Track */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-latte/50"
          />
          {/* Progress */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
              filter: 'drop-shadow(0 2px 5px rgba(22, 163, 74, 0.18))',
            }}
          />
        </svg>
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('metric font-bold text-espresso', s.value)}>
              {Math.round(value)}
            </span>
            {size !== 'sm' && (
              <span className="metric text-[10px] font-medium text-espresso/45">
                {unit ? `${unit} · ` : ''}/ {Math.round(max)}
              </span>
            )}
          </div>
        )}
      </div>
      {label && (
        <span
          className={cn(
            'mt-1.5 font-semibold uppercase tracking-wide text-espresso/55',
            s.label,
            isOver && 'text-terracotta'
          )}
        >
          {label}
        </span>
      )}
    </div>
  )
}

interface NutritionRingsProps {
  calories: { current: number; goal: number }
  protein: { current: number; goal: number }
  carbs: { current: number; goal: number }
  fat: { current: number; goal: number }
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function NutritionRings({
  calories,
  protein,
  carbs,
  fat,
  size = 'md',
  className,
}: NutritionRingsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <NutritionRing value={calories.current} max={calories.goal} label="Cal" color="calories" size={size} />
      <NutritionRing value={protein.current} max={protein.goal} label="Protein" color="protein" size={size} />
      <NutritionRing value={carbs.current} max={carbs.goal} label="Carbs" color="carbs" size={size} />
      <NutritionRing value={fat.current} max={fat.goal} label="Fat" color="fat" size={size} />
    </div>
  )
}
