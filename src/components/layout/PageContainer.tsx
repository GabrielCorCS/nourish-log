import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageContainerProps {
  children: ReactNode
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function PageContainer({
  children,
  title,
  description,
  action,
  className,
}: PageContainerProps) {
  return (
    <div className={cn(className)}>
      {(title || action) && (
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              {title && (
                <h1 className="font-heading text-2xl lg:text-3xl font-extrabold tracking-tight text-espresso">
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1.5 text-sm text-espresso/55">{description}</p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
          {title && (
            <span className="mt-3 block h-1 w-12 rounded-full bg-gradient-to-r from-emerald to-lime" />
          )}
        </div>
      )}
      {children}
    </div>
  )
}
