import { useState } from 'react'
import { PageContainer } from '@/components/layout'
import { Button, Input } from '@/components/ui'
import { EmptyState, LoadingState } from '@/components/shared'
import { useInvitations } from '@/hooks/useInvitations'
import { Mail, Trash2, UserPlus } from 'lucide-react'

export function Invitations() {
  const { invitations, isLoading, addInvitation, removeInvitation, isAdding } = useInvitations()
  const [email, setEmail] = useState('')

  async function handleAddInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    await addInvitation(email.trim().toLowerCase())
    setEmail('')
  }

  if (isLoading) {
    return (
      <PageContainer title="Invitations">
        <LoadingState message="Loading invitations…" />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Invitations">
      <div className="space-y-5">

        {/* Hero header tile */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#173B25] via-[#102b1b] to-[#0a1d12] p-6 text-white">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full opacity-50 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(132,204,22,0.4), transparent 70%)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-16 -left-8 h-40 w-40 rounded-full opacity-35 blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(34,210,123,0.35), transparent 70%)' }}
          />
          <div className="relative">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-lime/90">
              Household access
            </span>
            <h1 className="mt-1 font-display text-title font-semibold text-white">
              Invitations
            </h1>
            <p className="mt-1.5 text-sm text-white/65">
              Invite someone by email — they can sign in once it's added.
            </p>
          </div>
        </div>

        {/* Add invite form tile */}
        <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald/12 text-emerald-dark">
              <UserPlus className="h-4 w-4" />
            </span>
            <h2 className="font-display text-lg font-semibold leading-none text-espresso">
              Invite new user
            </h2>
          </div>
          <form onSubmit={handleAddInvite} className="flex gap-3">
            <Input
              type="email"
              placeholder="their@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isAdding || !email.trim()} leftIcon={<UserPlus className="h-4 w-4" />}>
              {isAdding ? 'Adding…' : 'Invite'}
            </Button>
          </form>
        </div>

        {/* Invited users list tile */}
        <div className="rounded-[28px] bg-warm-white p-5 ring-1 ring-latte/60">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-espresso">
              Invited users
            </h2>
            {invitations.length > 0 && (
              <span className="metric rounded-full bg-emerald/12 px-2.5 py-0.5 text-xs font-semibold text-emerald-dark">
                {invitations.length}
              </span>
            )}
          </div>

          {invitations.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-8 w-8" />}
              title="No invitations yet"
              description="Add email addresses above to invite people to NourishLog"
            />
          ) : (
            <ul className="stagger space-y-2">
              {invitations.map((invite) => (
                <li
                  key={invite.id}
                  className="pressable flex items-center justify-between rounded-[22px] bg-gradient-to-br from-emerald/[0.08] to-emerald/[0.03] px-4 py-3 ring-1 ring-emerald/15"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald/12 ring-1 ring-emerald/15">
                      <Mail className="h-4 w-4 text-emerald-dark" />
                    </div>
                    <div>
                      <p className="font-medium text-espresso">{invite.email}</p>
                      <p className="metric text-xs text-espresso/45">
                        Invited {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInvitation(invite.id)}
                    className="h-8 w-8 text-terracotta hover:bg-terracotta/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
