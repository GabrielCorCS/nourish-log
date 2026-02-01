import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  color?: 'default' | 'calories' | 'protein' | 'carbs' | 'fat'
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
}

export function Progress({
  value,
  max = 100,
  color = 'default',
  size = 'md',
  showValue = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colors = {
    default: 'bg-caramel',
    calories: 'bg-terracotta',
    protein: 'bg-sage',
    carbs: 'bg-honey',
    fat: 'bg-blush',
  }

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  }

  return (
    <div className={cn('w-full', className)} {...props}>
      <div className={cn('w-full bg-latte/30 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colors[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <div className="flex justify-between mt-1 text-xs text-espresso/60">
          <span>{value}</span>
          <span>{max}</span>
        </div>
      )}
    </div>
  )
}
