import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

// Edit your own identity (name + avatar emoji) on the canonical app_users row.
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const { user, refreshProfile } = useAuth()

  return useMutation({
    mutationFn: async (updates: { name?: string; avatar_emoji?: string }) => {
      if (!user) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: async () => {
      await refreshProfile()
      queryClient.invalidateQueries({ queryKey: ['household'] })
    },
  })
}

export function useUpdateHouseholdName() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ householdId, name }: { householdId: string; name: string }) => {
      const { error } = await supabase.from('households').update({ name }).eq('id', householdId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household'] }),
  })
}

// "Share access by email": links another existing account into your household
// (via a SECURITY DEFINER RPC, since RLS hides non-member app_users rows).
export function useAddPartnerByEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.rpc('add_household_member_by_email', {
        _email: email.trim(),
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household'] }),
  })
}
