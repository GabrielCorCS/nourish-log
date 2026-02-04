import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Card, Button } from '@/components/ui'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true

    async function completeSignIn() {
      try {
        // If Supabase redirected back with a PKCE code, explicitly exchange it.
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(
            window.location.href
          )
          if (exchangeError) throw exchangeError
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          throw new Error(
            'No session found after authentication. This usually means the redirect URL is not allow-listed in Supabase Auth settings.'
          )
        }

        navigate('/', { replace: true })
      } catch (e) {
        console.error('Auth callback error:', e)
        if (!alive) return
        setError(e instanceof Error ? e.message : 'Authentication failed')
      }
    }

    completeSignIn()
    return () => {
      alive = false
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center space-y-3">
          <h1 className="font-heading text-2xl font-bold text-espresso">Signing you in…</h1>

          {!error ? (
            <p className="text-espresso/60">Finishing authentication.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-espresso/70">{error}</p>
              <div className="rounded-lg border border-latte bg-white p-3 text-left text-xs text-espresso/70">
                <div className="font-medium text-espresso mb-1">Supabase fix to check:</div>
                <div>
                  Auth → URL Configuration → Additional Redirect URLs should include:
                </div>
                <div className="font-mono mt-1">{window.location.origin}/auth/callback</div>
              </div>
              <Button onClick={() => navigate('/login', { replace: true })} className="w-full">
                Back to login
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
