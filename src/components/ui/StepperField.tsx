import { Minus, Plus } from 'lucide-react'
import { useNumericInput } from '@/hooks/useNumericInput'
import { cn } from '@/lib/utils'

export interface StepperFieldProps {
  value: number
  onChange: (value: number) => void
  /** Amount the +/- buttons nudge by. */
  step?: number
  /** Floor applied to typed/stepped values (defaults to `step`). */
  min?: number
  /** Short trailing label, e.g. a unit like "g". */
  suffix?: string
  className?: string
  inputClassName?: string
  ariaLabel?: string
}

const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * A +/- stepper whose value is also directly typeable. The text field accepts
 * arbitrary precision (e.g. "0.25"); the buttons nudge by `step` and round to
 * avoid float drift. Both paths clamp to `min`.
 */
export function StepperField({
  value,
  onChange,
  step = 1,
  min,
  suffix,
  className,
  inputClassName,
  ariaLabel = 'Amount',
}: StepperFieldProps) {
  const floor = min ?? step
  const clamp = (n: number) => Math.max(floor, n)
  // Typed entry: report exactly what's typed (the hook clamps to `min` on blur).
  const inputProps = useNumericInput(value, onChange, { min: floor })

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-[10px] bg-warm-white px-1 py-0.5 ring-1 ring-latte/60',
        className
      )}
    >
      <button
        type="button"
        aria-label="Decrease"
        className="grid h-7 w-7 place-items-center rounded-md text-espresso/70 transition-colors hover:bg-latte/40"
        onClick={() => onChange(clamp(round2(value - step)))}
      >
        <Minus className="h-3 w-3" />
      </button>
      <div className="flex items-baseline justify-center gap-0.5">
        <input
          {...inputProps}
          aria-label={ariaLabel}
          className={cn(
            'metric w-12 bg-transparent text-center text-sm font-semibold text-espresso focus:outline-none',
            inputClassName
          )}
        />
        {suffix && <span className="text-xs text-espresso/55">{suffix}</span>}
      </div>
      <button
        type="button"
        aria-label="Increase"
        className="grid h-7 w-7 place-items-center rounded-md text-espresso/70 transition-colors hover:bg-latte/40"
        onClick={() => onChange(clamp(round2(value + step)))}
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  )
}
