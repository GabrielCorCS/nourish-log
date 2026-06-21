import { cn } from '@/lib/utils'
import { formatMacro } from '@/lib/utils'

interface MacroDisplayProps {
  calories: number
  protein: number
  carbs: number
  fat: number
  size?: 'sm' | 'md' | 'lg'
  layout?: 'horizontal' | 'vertical' | 'grid'
  showLabels?: boolean
  className?: string
}

export function MacroDisplay({
  calories,
  protein,
  carbs,
  fat,
  size = 'md',
  layout = 'horizontal',
  showLabels = true,
  className,
}: MacroDisplayProps) {
  const macros = [
    { label: 'Calories', value: Math.round(calories), unit: '', color: 'text-terracotta' },
    { label: 'Protein', value: formatMacro(protein), unit: 'g', color: 'text-sage' },
    { label: 'Carbs', value: formatMacro(carbs), unit: 'g', color: 'text-honey' },
    { label: 'Fat', value: formatMacro(fat), unit: 'g', color: 'text-blush' },
  ]

  const sizes = {
    sm: {
      value: 'text-sm font-semibold',
      label: 'text-xs',
    },
    md: {
      value: 'text-base font-semibold',
      label: 'text-xs',
    },
    lg: {
      value: 'text-lg font-bold',
      label: 'text-sm',
    },
  }

  const layouts = {
    horizontal: 'flex items-center gap-4',
    vertical: 'flex flex-col gap-2',
    grid: 'grid grid-cols-2 gap-2',
  }

  return (
    <div className={cn(layouts[layout], className)}>
      {macros.map((macro) => (
        <div
          key={macro.label}
          className={cn(
            'flex',
            layout === 'horizontal' ? 'items-center gap-1' : 'flex-col'
          )}
        >
          {showLabels && (
            <span className={cn(sizes[size].label, 'text-espresso/50')}>
              {macro.label}
            </span>
          )}
          <span className={cn('tnum', sizes[size].value, macro.color)}>
            {macro.value}
            {macro.unit && <span className="text-espresso/50">{macro.unit}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}

interface MacroPillsProps {
  calories: number
  protein: number
  carbs: number
  fat: number
  hideCalories?: boolean
  className?: string
}

export function MacroPills({
  calories,
  protein,
  carbs,
  fat,
  hideCalories = false,
  className,
}: MacroPillsProps) {
  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {!hideCalories && (
        <span className="metric rounded-full bg-terracotta/10 px-2 py-0.5 text-xs font-semibold text-terracotta">
          {Math.round(calories)} cal
        </span>
      )}
      <span className="metric rounded-full bg-sage/15 px-2 py-0.5 text-xs font-semibold text-sage">
        {formatMacro(protein)}g P
      </span>
      <span className="metric rounded-full bg-honey/25 px-2 py-0.5 text-xs font-semibold text-espresso/75">
        {formatMacro(carbs)}g C
      </span>
      <span className="metric rounded-full bg-blush/25 px-2 py-0.5 text-xs font-semibold text-espresso/75">
        {formatMacro(fat)}g F
      </span>
    </div>
  )
}
