import { useState } from 'react'
import { UserPlus, Trash2, Crown, User } from 'lucide-react'
import { PageContainer } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui'
import { EmojiPicker, EmptyState, LoadingState } from '@/components/shared'
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks'
import { useUserStore } from '@/stores/userStore'
import type { AppUser } from '@/types/database'

export function UserManagement() {
  const { data: users, isLoading } = useUsers()
  const { currentUser } = useUserStore()
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AppUser | null>(null)
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AppUser | null>(null)

  // Form state
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [avatarEmoji, setAvatarEmoji] = useState('👤')
  const [isAdmin, setIsAdmin] = useState(false)

  const isCurrentUserAdmin = currentUser?.is_admin ?? false

  const resetForm = () => {
    setEmail('')
    setName('')
    setAvatarEmoji('👤')
    setIsAdmin(false)
  }

  const openEditModal = (user: AppUser) => {
    setEditingUser(user)
    setEmail(user.email)
    setName(user.name)
    setAvatarEmoji(user.avatar_emoji || '👤')
    setIsAdmin(user.is_admin)
  }

  const handleAddUser = async () => {
    if (!email || !name) return

    try {
      await createUser.mutateAsync({
        email,
        name,
        avatar_emoji: avatarEmoji,
        is_admin: isAdmin,
      })
      setIsAddModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Failed to add user:', error)
    }
  }

  const handleUpdateUser = async () => {
    if (!editingUser || !email || !name) return

    try {
      await updateUser.mutateAsync({
        id: editingUser.id,
        email,
        name,
        avatar_emoji: avatarEmoji,
        is_admin: isAdmin,
      })
      setEditingUser(null)
      resetForm()
    } catch (error) {
      console.error('Failed to update user:', error)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteConfirmUser) return

    try {
      await deleteUser.mutateAsync(deleteConfirmUser.id)
      setDeleteConfirmUser(null)
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  if (isLoading) {
    return (
      <PageContainer title="User Management">
        <LoadingState message="Loading users..." />
      </PageContainer>
    )
  }

  if (!isCurrentUserAdmin) {
    return (
      <PageContainer title="User Management">
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={<User className="h-8 w-8" aria-hidden="true" />}
              title="Access Denied"
              description="You need admin privileges to manage users."
            />
          </CardContent>
        </Card>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="User Management"
      action={
        <Button onClick={() => setIsAddModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle>Users ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {users?.length === 0 ? (
            <EmptyState
              icon={<User className="h-8 w-8" aria-hidden="true" />}
              title="No users yet"
              description="Add your first user to get started."
              action={{
                label: 'Add User',
                onClick: () => setIsAddModalOpen(true),
              }}
            />
          ) : (
            <div className="divide-y divide-latte/30">
              {users?.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <span className="text-3xl">{user.avatar_emoji || '👤'}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-espresso">{user.name}</p>
                      {user.is_admin && (
                        <span className="inline-flex items-center gap-1 text-xs bg-caramel/20 text-caramel px-2 py-0.5 rounded-full">
                          <Crown className="h-3 w-3" />
                          Admin
                        </span>
                      )}
                      {currentUser?.id === user.id && (
                        <span className="text-xs bg-sage/20 text-sage px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-espresso/60">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(user)}
                    >
                      Edit
                    </Button>
                    {currentUser?.id !== user.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmUser(user)}
                      >
                        <Trash2 className="h-4 w-4 text-terracotta" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Avatar
                </label>
                <EmojiPicker
                  value={avatarEmoji}
                  onChange={setAvatarEmoji}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-latte text-caramel focus:ring-caramel"
                />
                <span className="text-sm text-espresso">Admin privileges</span>
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddModalOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUser}
              disabled={!email || !name || createUser.isPending}
            >
              {createUser.isPending ? 'Adding...' : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Name
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-espresso mb-1">
                  Avatar
                </label>
                <EmojiPicker
                  value={avatarEmoji}
                  onChange={setAvatarEmoji}
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAdmin}
                  onChange={(e) => setIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-latte text-caramel focus:ring-caramel"
                />
                <span className="text-sm text-espresso">Admin privileges</span>
              </label>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setEditingUser(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={!email || !name || updateUser.isPending}
            >
              {updateUser.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <p className="text-espresso">
              Are you sure you want to delete <strong>{deleteConfirmUser?.name}</strong>?
              This will also delete all their data (recipes, food entries, etc.).
            </p>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmUser(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteUser}
              disabled={deleteUser.isPending}
              className="bg-terracotta hover:bg-terracotta/90"
            >
              {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}
