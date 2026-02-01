import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { useUserStore } from '@/stores/userStore'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
  )
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Helper to get current user ID from userStore
export const getCurrentUserId = (): string | null => {
  const { currentUser } = useUserStore.getState()
  return currentUser?.id ?? null
}
