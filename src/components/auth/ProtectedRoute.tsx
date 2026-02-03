import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/shared'

interface ProtectedRouteProps {
  children: ReactNode
  requireAdmin?: boolean
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { session, isLoading, isAdmin } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <LoadingState message="Loading..." />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
