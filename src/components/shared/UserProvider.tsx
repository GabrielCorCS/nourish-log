import type { ReactNode } from 'react'
import { useUsers } from '@/hooks'
import { useUserStore } from '@/stores/userStore'
import { LoadingState } from './LoadingState'

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { isLoading: storeLoading } = useUserStore()
  const { isLoading: queryLoading, error } = useUsers()

  const isLoading = storeLoading && queryLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingState message="Loading NourishLog..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-espresso text-lg mb-2">Failed to load users</p>
          <p className="text-espresso/60 text-sm">{error.message}</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
