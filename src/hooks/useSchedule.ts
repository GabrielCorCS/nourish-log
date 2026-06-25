import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useHouseholdId } from '@/hooks/useHousehold'

export interface AvailabilityWindowRow {
  id: string
  user_id: string
  weekday: number
  start_minute: number
  end_minute: number
}

export interface CalendarTask {
  id: string
  created_by: string | null
  assignee_user_id: string
  title: string
  notes: string | null
  duration_minutes: number
  scheduled_start: string
  scheduled_end: string
  status: string
}

const AVAIL_KEY = ['availability-windows']
const TASKS_KEY = ['calendar-tasks']

export function useAvailabilityWindows() {
  const { user } = useAuth()
  return useQuery({
    queryKey: AVAIL_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('availability_windows')
        .select('id, user_id, weekday, start_minute, end_minute')
      if (error) throw error
      return data as AvailabilityWindowRow[]
    },
    enabled: !!user,
  })
}

export function useUpsertAvailabilityWindow() {
  const qc = useQueryClient()
  const householdId = useHouseholdId()
  return useMutation({
    mutationFn: async (w: {
      user_id: string
      weekday: number
      start_minute: number
      end_minute: number
    }) => {
      if (!householdId) throw new Error('No household found')
      const { error } = await supabase
        .from('availability_windows')
        .upsert(
          { ...w, household_id: householdId, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,weekday' }
        )
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: AVAIL_KEY }),
  })
}

export function useDeleteAvailabilityWindow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ user_id, weekday }: { user_id: string; weekday: number }) => {
      const { error } = await supabase
        .from('availability_windows')
        .delete()
        .eq('user_id', user_id)
        .eq('weekday', weekday)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: AVAIL_KEY }),
  })
}

export function useCalendarTasks(range?: { start: Date; end: Date }) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...TASKS_KEY, range?.start?.toISOString(), range?.end?.toISOString()],
    queryFn: async () => {
      let q = supabase
        .from('calendar_tasks')
        .select('*')
        .order('scheduled_start', { ascending: true })
      if (range) {
        q = q
          .gte('scheduled_start', range.start.toISOString())
          .lte('scheduled_start', range.end.toISOString())
      }
      const { data, error } = await q
      if (error) throw error
      return data as CalendarTask[]
    },
    enabled: !!user,
  })
}

/** An assignee's not-yet-finished tasks — used to compute the next free slot. */
export function useUpcomingTasksFor(assigneeId?: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...TASKS_KEY, 'upcoming', assigneeId],
    queryFn: async () => {
      if (!assigneeId) return [] as CalendarTask[]
      const { data, error } = await supabase
        .from('calendar_tasks')
        .select('*')
        .eq('assignee_user_id', assigneeId)
        .gte('scheduled_end', new Date().toISOString())
        .order('scheduled_start', { ascending: true })
      if (error) throw error
      return data as CalendarTask[]
    },
    enabled: !!user && !!assigneeId,
  })
}

export function useCreateCalendarTask() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const householdId = useHouseholdId()
  return useMutation({
    mutationFn: async (t: {
      assignee_user_id: string
      title: string
      notes?: string | null
      duration_minutes: number
      scheduled_start: string
      scheduled_end: string
    }) => {
      if (!user) throw new Error('Not authenticated')
      if (!householdId) throw new Error('No household found')
      const { data, error } = await supabase
        .from('calendar_tasks')
        .insert({ ...t, household_id: householdId, created_by: user.id })
        .select()
        .single()
      if (error) throw error
      return data as CalendarTask
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useDeleteCalendarTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}
