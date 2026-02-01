import { ChefHat, Zap } from 'lucide-react'
import { useLogMealStore } from '@/stores'
import { cn } from '@/lib/utils'

export function SourceSelector() {
  const setSource = useLogMealStore((state) => state.setSource)

  const options = [
    {
      value: 'recipe' as const,
      icon: ChefHat,
      title: 'From Recipe',
      description: 'Select one of your saved recipes',
    },
    {
      value: 'quick-add' as const,
      icon: Zap,
      title: 'Quick Add',
      description: 'Add individual ingredients',
    },
  ]

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setSource(option.value)}
          className={cn(
            'w-full flex items-center gap-4 p-4 rounded-card',
            'bg-cream border-2 border-transparent',
            'hover:border-caramel hover:bg-caramel/5',
            'transition-all duration-200 text-left',
            'focus:outline-none focus:ring-2 focus:ring-caramel focus:ring-offset-2'
          )}
        >
          <div className="w-12 h-12 flex items-center justify-center bg-caramel/10 rounded-full">
            <option.icon className="h-6 w-6 text-caramel" />
          </div>
          <div>
            <p className="font-medium text-espresso">{option.title}</p>
            <p className="text-sm text-espresso/50">{option.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}
