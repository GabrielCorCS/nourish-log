import { create } from 'zustand'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIStore {
  // Modal states
  isLogMealModalOpen: boolean
  isIngredientModalOpen: boolean
  isRecipeModalOpen: boolean

  // Toast notifications
  toasts: Toast[]

  // Actions
  openLogMealModal: () => void
  closeLogMealModal: () => void
  openIngredientModal: () => void
  closeIngredientModal: () => void
  openRecipeModal: () => void
  closeRecipeModal: () => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isLogMealModalOpen: false,
  isIngredientModalOpen: false,
  isRecipeModalOpen: false,
  toasts: [],

  openLogMealModal: () => set({ isLogMealModalOpen: true }),
  closeLogMealModal: () => set({ isLogMealModalOpen: false }),

  openIngredientModal: () => set({ isIngredientModalOpen: true }),
  closeIngredientModal: () => set({ isIngredientModalOpen: false }),

  openRecipeModal: () => set({ isRecipeModalOpen: true }),
  closeRecipeModal: () => set({ isRecipeModalOpen: false }),

  addToast: (message, type = 'info') => {
    const id = crypto.randomUUID()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }))
    // Auto-remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 4000)
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
