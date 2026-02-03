import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleSignInButton } from '@/components/auth'
import { Card } from '@/components/ui'

export function Login() {
  const { session, isLoading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (session && !isLoading) {
      navigate('/', { replace: true })
    }
  }, [session, isLoading, navigate])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-espresso">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold text-espresso mb-2">
            NourishLog
          </h1>
          <p className="text-espresso/60">
            Track your nutrition, build healthy habits
          </p>
        </div>

        <div className="space-y-4">
          <GoogleSignInButton onSignIn={signInWithGoogle} />
          
          <p className="text-center text-sm text-espresso/50 mt-6">
            Sign in requires an invitation. Contact the admin if you don't have access.
          </p>
        </div>
      </Card>
    </div>
  )
}
