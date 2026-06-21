import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui'

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

  if (!error) {
    return (
      <div className="brand-gradient flex min-h-[100dvh] items-center justify-center">
        {/* Decorative blobs — match Login */}
        <div className="brand-blob -left-16 -top-10 h-56 w-56 bg-lime/60 animate-float" />
        <div
          className="brand-blob -right-20 top-24 h-64 w-64 bg-emerald/70 animate-float"
          style={{ animationDelay: '1.5s' }}
        />
        <div className="brand-blob bottom-10 -left-10 h-48 w-48 bg-citrus/40 animate-float" />

        <div className="relative z-10 flex flex-col items-center gap-5 text-white">
          {/* App icon */}
          <div className="grid h-20 w-20 place-items-center rounded-[28px] bg-white/15 text-4xl shadow-glow ring-1 ring-white/25 backdrop-blur-md">
            🥗
          </div>

          {/* Spinner */}
          <svg
            className="h-8 w-8 animate-spin text-white/80"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>

          <p className="animate-pulse text-sm font-medium tracking-wide text-white/85">
            Signing you in…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="brand-gradient flex min-h-[100dvh] items-center justify-center p-6">
      <div className="brand-blob -left-16 -top-10 h-56 w-56 bg-lime/60 animate-float" />
      <div
        className="brand-blob -right-20 top-24 h-64 w-64 bg-emerald/70 animate-float"
        style={{ animationDelay: '1.5s' }}
      />

      <div className="relative z-10 w-full max-w-sm animate-slide-up">
        <div className="rounded-[28px] bg-white/12 p-7 text-white ring-1 ring-white/20 backdrop-blur-md">
          {/* Icon */}
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-[22px] bg-terracotta/30 ring-1 ring-white/20">
            <span className="text-2xl">⚠️</span>
          </div>

          <h1 className="font-display text-title font-semibold text-white">
            Sign-in failed
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/75">{error}</p>

          {/* Supabase hint */}
          <div className="mt-4 rounded-[16px] bg-black/20 p-4 text-xs text-white/70 ring-1 ring-white/10">
            <p className="mb-1 font-semibold text-white/90">Fix to check in Supabase</p>
            <p>Auth → URL Configuration → Additional Redirect URLs should include:</p>
            <p className="mt-1.5 font-mono text-lime/90">{window.location.origin}/auth/callback</p>
          </div>

          <Button
            onClick={() => navigate('/login', { replace: true })}
            className="mt-6 w-full"
          >
            Back to login
          </Button>
        </div>
      </div>
    </div>
  )
}
