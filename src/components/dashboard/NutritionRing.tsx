import { cn } from '@/lib/utils'
import { calculatePercentage } from '@/lib/utils'

interface NutritionRingProps {
  value: number
  max: number
  label: string
  color: 'calories' | 'protein' | 'carbs' | 'fat'
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}

export function NutritionRing({
  value,
  max,
  label,
  color,
  size = 'md',
  showValue = true,
  className,
}: NutritionRingProps) {
  const percentage = calculatePercentage(value, max)
  const isOver = value > max

  const sizes = {
    sm: { ring: 60, stroke: 4, text: 'text-xs' },
    md: { ring: 80, stroke: 6, text: 'text-sm' },
    lg: { ring: 120, stroke: 8, text: 'text-base' },
  }

  const colors = {
    calories: 'stroke-terracotta',
    protein: 'stroke-sage',
    carbs: 'stroke-honey',
    fat: 'stroke-blush',
  }

  const s = sizes[size]
  const radius = (s.ring - s.stroke) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: s.ring, height: s.ring }}>
        <svg
          className="nutrition-ring"
          width={s.ring}
          height={s.ring}
        >
          {/* Background circle */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={s.stroke}
            className="text-latte/30"
          />
          {/* Progress circle */}
          <circle
            cx={s.ring / 2}
            cy={s.ring / 2}
            r={radius}
            fill="none"
            strokeWidth={s.stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(colors[color], isOver && 'stroke-terracotta')}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out',
            }}
          />
        </svg>
        {/* Center text */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn('font-bold text-espresso', s.text)}>
              {Math.round(value)}
            </span>
            {size !== 'sm' && (
              <span className="text-[10px] text-espresso/50">/ {max}</span>
            )}
          </div>
        )}
      </div>
      <span className={cn('mt-1 font-medium text-espresso/70', s.text)}>
        {label}
      </span>
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
      <NutritionRing
        value={calories.current}
        max={calories.goal}
        label="Calories"
        color="calories"
        size={size}
      />
      <NutritionRing
        value={protein.current}
        max={protein.goal}
        label="Protein"
        color="protein"
        size={size}
      />
      <NutritionRing
        value={carbs.current}
        max={carbs.goal}
        label="Carbs"
        color="carbs"
        size={size}
      />
      <NutritionRing
        value={fat.current}
        max={fat.goal}
        label="Fat"
        color="fat"
        size={size}
      />
    </div>
  )
}
