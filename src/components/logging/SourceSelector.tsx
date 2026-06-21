import { ChefHat, Zap } from 'lucide-react'
import { useLogMealStore } from '@/stores'
import { cn } from '@/lib/utils'

export function SourceSelector() {
  const setSource = useLogMealStore((state) => state.setSource)

  const options = [
    {
      value: 'recipe' as const,
      icon: ChefHat,
      title: 'From recipe',
      description: 'Select one of your saved recipes',
      tile: 'from-emerald/[0.10] to-emerald/[0.03] ring-emerald/15 hover:ring-emerald/40 hover:from-emerald/[0.16]',
      iconBg: 'bg-emerald/12 text-emerald-dark',
    },
    {
      value: 'quick-add' as const,
      icon: Zap,
      title: 'Quick add',
      description: 'Add individual ingredients',
      tile: 'from-honey/[0.14] to-honey/[0.04] ring-honey/20 hover:ring-honey/40 hover:from-honey/[0.20]',
      iconBg: 'bg-honey/15 text-[#A9791B]',
    },
  ]

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => setSource(option.value)}
          className={cn(
            'pressable w-full flex items-center gap-4 rounded-[22px] p-4 text-left',
            'bg-gradient-to-br ring-1 transition-all duration-200',
            option.tile,
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald'
          )}
        >
          <div className={cn('grid h-12 w-12 shrink-0 place-items-center rounded-2xl', option.iconBg)}>
            <option.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-semibold text-espresso">{option.title}</p>
            <p className="text-sm text-espresso/50">{option.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
