import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useViewStore } from '@/stores/viewStore'
import type { BodyMetric, BodyMetricSource } from '@/types/database'

const KEY = ['body-metrics']

// Pass targetUserId to view a household member's weigh-ins (partner view).
export function useBodyMetrics(targetUserId?: string) {
  const { user } = useAuth()
  const viewUserId = useViewStore((s) => s.viewUserId)
  const subjectId = targetUserId ?? viewUserId ?? user?.id

  return useQuery({
    queryKey: [...KEY, subjectId],
    enabled: !!subjectId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_metrics')
        .select('*')
        .eq('user_id', subjectId!)
        .order('measured_at', { ascending: true })
      if (error) throw error
      return data as BodyMetric[]
    },
  })
}

interface AddBodyMetricInput {
  user_id?: string // subject; defaults to current user (proxy logging supported)
  measured_at?: string
  weight_kg?: number | null
  body_fat_pct?: number | null
  source?: BodyMetricSource
  notes?: string | null
}

export function useAddBodyMetric() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (input: AddBodyMetricInput) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('body_metrics').insert({
        user_id: input.user_id ?? user.id,
        logged_by: user.id,
        measured_at: input.measured_at,
        weight_kg: input.weight_kg ?? null,
        body_fat_pct: input.body_fat_pct ?? null,
        source: input.source ?? 'manual',
        notes: input.notes ?? null,
      })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
