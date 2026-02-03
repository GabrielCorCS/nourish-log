import { useState } from 'react'
import { PageContainer } from '@/components/layout'
import { Card, Button, Input } from '@/components/ui'
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
        <LoadingState message="Loading invitations..." />
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Invitations">
      <div className="space-y-6">
        {/* Add Invitation Form */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
            Invite New User
          </h2>
          <form onSubmit={handleAddInvite} className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={isAdding || !email.trim()}>
              <UserPlus className="h-4 w-4 mr-2" />
              {isAdding ? 'Adding...' : 'Invite'}
            </Button>
          </form>
        </Card>

        {/* Invitations List */}
        <Card className="p-6">
          <h2 className="font-heading text-lg font-semibold text-espresso mb-4">
            Invited Users ({invitations.length})
          </h2>

          {invitations.length === 0 ? (
            <EmptyState
              icon={<Mail className="h-12 w-12" />}
              title="No invitations yet"
              description="Add email addresses to invite users to NourishLog"
            />
          ) : (
            <ul className="space-y-3">
              {invitations.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-cream rounded-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-latte flex items-center justify-center">
                      <Mail className="h-5 w-5 text-espresso/60" />
                    </div>
                    <div>
                      <p className="font-medium text-espresso">{invite.email}</p>
                      <p className="text-xs text-espresso/50">
                        Invited {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInvitation(invite.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
