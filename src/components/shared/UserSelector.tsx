import { useState } from 'react'
import { ChevronDown, Eye } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import type { AppUser } from '@/types/database'

export function UserSelector() {
  const { currentUser, users, setCurrentUser } = useUserStore()
  const [isOpen, setIsOpen] = useState(false)

  if (!currentUser || users.length <= 1) {
    return null
  }

  const handleSelectUser = (user: AppUser) => {
    setCurrentUser(user)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-cream rounded-lg hover:bg-latte/30 transition-colors"
      >
        <Eye className="h-4 w-4 text-caramel" />
        <span className="text-sm font-medium text-espresso">
          {currentUser.avatar_emoji} {currentUser.name}
        </span>
        <ChevronDown className={`h-4 w-4 text-espresso/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-warm-white rounded-xl shadow-cozy border border-latte/30 py-2 z-20">
            <div className="px-3 py-2 border-b border-latte/30">
              <p className="text-xs font-medium text-espresso/60 uppercase tracking-wide">
                View as
              </p>
            </div>
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full flex items-center gap-3 px-3 py-2 hover:bg-cream transition-colors ${
                  currentUser.id === user.id ? 'bg-cream' : ''
                }`}
              >
                <span className="text-xl">{user.avatar_emoji || '👤'}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-espresso">{user.name}</p>
                  <p className="text-xs text-espresso/60">{user.email}</p>
                </div>
                {user.is_admin && (
                  <span className="text-xs bg-caramel/20 text-caramel px-2 py-0.5 rounded-full">
                    Admin
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
