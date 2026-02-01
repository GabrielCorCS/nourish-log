import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 mb-4 flex items-center justify-center bg-latte/20 rounded-full text-espresso/40">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-espresso mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-espresso/50 max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </div>
  )
}
