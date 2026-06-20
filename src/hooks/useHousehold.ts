import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import type { AppUser } from '@/types/database'

export interface HouseholdInfo {
  householdId: string | null
  householdName: string | null
  members: AppUser[]
  me: AppUser | null
  /** The other member of the household (this app is built for two). */
  partner: AppUser | null
}

/**
 * Resolves the current user's shared household: its id, all members, and the
 * "partner" (the other person). Used wherever we create shared rows (which must
 * carry household_id) or render the partner's identity/stats.
 */
export function useHousehold() {
  const { user } = useAuth()
  const userId = user?.id

  return useQuery({
    queryKey: ['household', userId],
    enabled: !!userId,
    queryFn: async (): Promise<HouseholdInfo> => {
      const { data: membership } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', userId!)
        .maybeSingle()

      const householdId = membership?.household_id ?? null
      if (!householdId) {
        return { householdId: null, householdName: null, members: [], me: null, partner: null }
      }

      const [{ data: rows }, { data: hh }] = await Promise.all([
        supabase
          .from('household_members')
          .select('user_id, app_users(*)')
          .eq('household_id', householdId),
        supabase.from('households').select('name').eq('id', householdId).maybeSingle(),
      ])

      const members = (rows ?? [])
        .map((r) => r.app_users as AppUser | null)
        .filter((u): u is AppUser => !!u)

      return {
        householdId,
        householdName: hh?.name ?? null,
        members,
        me: members.find((u) => u.id === userId) ?? null,
        partner: members.find((u) => u.id !== userId) ?? null,
      }
    },
  })
}

/** Convenience: just the household id (for setting household_id on inserts). */
export function useHouseholdId(): string | null {
  return useHousehold().data?.householdId ?? null
}
