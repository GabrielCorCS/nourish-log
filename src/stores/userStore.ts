import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppUser } from '../types/database'

interface UserState {
  // Current selected user (for "view as" functionality)
  currentUser: AppUser | null
  // All users in the system
  users: AppUser[]
  // Loading state
  isLoading: boolean

  // Actions
  setCurrentUser: (user: AppUser | null) => void
  setUsers: (users: AppUser[]) => void
  setLoading: (loading: boolean) => void

  // Computed
  isAdmin: () => boolean
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [],
      isLoading: true,

      setCurrentUser: (user) => set({ currentUser: user }),
      setUsers: (users) => set({ users }),
      setLoading: (loading) => set({ isLoading: loading }),

      isAdmin: () => get().currentUser?.is_admin ?? false,
    }),
    {
      name: 'nourish-user-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
)
