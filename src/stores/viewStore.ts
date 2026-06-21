import { create } from 'zustand'

// Which household member's data the UI is currently showing.
// null = the signed-in user (self). Set to a member id to view their data.
interface ViewStore {
  viewUserId: string | null
  setViewUser: (id: string | null) => void
}

export const useViewStore = create<ViewStore>((set) => ({
  viewUserId: null,
  setViewUser: (viewUserId) => set({ viewUserId }),
}))
