// Re-export supabase client from the integrations folder
export { supabase } from '@/integrations/supabase/client'

// Demo user ID for development (when auth is not configured)
export const DEMO_USER_ID = '00000000-0000-0000-0000-000000000000'

// Helper to get current user ID or demo ID
import { supabase } from '@/integrations/supabase/client'

export const getCurrentUserId = async (): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || DEMO_USER_ID
}
