import { Check } from 'lucide-react'
import { PAYMENT_CARDS } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface CardPickerProps {
  value: string | null
  onChange: (cardId: string) => void
  error?: string
}

/** Required card selector rendered as physical-looking card faces. */
export function CardPicker({ value, onChange, error }: CardPickerProps) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-espresso">
        Card <span className="text-terracotta">*</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {PAYMENT_CARDS.map((card) => {
          const selected = value === card.id
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => onChange(card.id)}
              aria-pressed={selected}
              className={cn(
                'pressable relative flex aspect-[1.6/1] flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br p-3 text-left shadow-soft transition-all',
                card.gradient,
                selected
                  ? 'scale-[1.02] ring-2 ring-emerald ring-offset-2 ring-offset-cream'
                  : 'ring-1 ring-black/10'
              )}
            >
              {selected && (
                <span className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-white text-emerald-dark shadow">
                  <Check className="h-3 w-3" />
                </span>
              )}
              {/* EMV chip */}
              <span className="block h-5 w-7 rounded-[4px] bg-white/30 ring-1 ring-white/25" />
              <div>
                <p className={cn('font-display text-sm font-semibold leading-tight', card.text)}>
                  {card.label}
                </p>
                <p className={cn('metric text-[11px]', card.subtle)}>
                  {card.network} ···· ····
                </p>
              </div>
            </button>
          )
        })}
      </div>
      {error && <p className="mt-1.5 text-sm text-terracotta">{error}</p>}
    </div>
  )
}
