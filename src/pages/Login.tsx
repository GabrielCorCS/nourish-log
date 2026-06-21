import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleSignInButton } from '@/components/auth'

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
      <div className="brand-gradient flex min-h-[100dvh] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-white/90">
          <div className="grid h-16 w-16 place-items-center rounded-3xl bg-white/15 text-3xl backdrop-blur-sm">
            🥗
          </div>
          <div className="animate-pulse text-sm font-medium tracking-wide">Loading…</div>
        </div>
      </div>
    )
  }

  return (
    <div className="brand-gradient relative flex min-h-[100dvh] flex-col overflow-hidden text-white">
      {/* Decorative organic blobs */}
      <div className="brand-blob animate-float -left-16 -top-10 h-56 w-56 bg-lime/60" />
      <div className="brand-blob -right-20 top-24 h-64 w-64 bg-emerald/70" style={{ animationDelay: '1.5s' }} />
      <div className="brand-blob bottom-10 -left-10 h-48 w-48 bg-citrus/40" />

      {/* Content column, centered and width-capped for larger screens */}
      <div className="pt-safe pb-safe relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col px-7">
        {/* Brand block — sits in the upper-middle */}
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="animate-scale-in grid h-24 w-24 place-items-center rounded-[28px] bg-white/15 text-5xl shadow-glow ring-1 ring-white/25 backdrop-blur-md">
            🥗
          </div>

          <h1 className="mt-7 font-heading text-[2.6rem] font-extrabold leading-none tracking-tight">
            NourishLog
          </h1>
          <p className="mt-3 max-w-[16rem] text-base font-medium leading-snug text-white/85">
            Eat well, together — every meal, every day.
          </p>

          <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/12 px-3.5 py-1.5 text-xs font-medium text-white/85 ring-1 ring-white/20 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-lime" />
            Gabriel &amp; Kaylin&rsquo;s kitchen
          </span>
        </div>

        {/* Action — pinned to the thumb zone near the bottom */}
        <div className="animate-slide-up space-y-4 pb-2">
          <GoogleSignInButton onSignIn={signInWithGoogle} />

          <p className="text-center text-[13px] leading-relaxed text-white/70">
            Invitation-only. Ask the other half of the household if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
