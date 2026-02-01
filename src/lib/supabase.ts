import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { useUserStore } from '@/stores/userStore'

const SUPABASE_URL = 'https://tnynamuwaaqquwenkphq.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRueW5hbXV3YWFxcXV3ZW5rcGhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5MjkxNDQsImV4cCI6MjA4NTUwNTE0NH0.tFQ78v5H6EGcDOronS-E5gEMVKqRkbufcsZSh_h-6Cg'

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY)

// Helper to get current user ID from userStore
export const getCurrentUserId = (): string | null => {
  const { currentUser } = useUserStore.getState()
  return currentUser?.id ?? null
}
