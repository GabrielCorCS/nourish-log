import { cn } from '@/lib/utils'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-latte/30" />
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-caramel border-t-transparent animate-spin" />
      </div>
      {message && (
        <p className="mt-4 text-sm text-espresso/50">{message}</p>
      )}
    </div>
  )
}

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-latte/30 rounded-input',
        className
      )}
    />
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-warm-white rounded-card p-4 space-y-3">
      <LoadingSkeleton className="h-4 w-2/3" />
      <LoadingSkeleton className="h-4 w-1/2" />
      <div className="flex gap-2">
        <LoadingSkeleton className="h-6 w-16" />
        <LoadingSkeleton className="h-6 w-16" />
        <LoadingSkeleton className="h-6 w-16" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
