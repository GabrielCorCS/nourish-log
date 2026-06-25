import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { useUIStore } from '@/stores'

export interface AppNotification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
  actor_user_id: string | null
}

const NOTIF_KEY = ['notifications']

export function useNotifications() {
  const { user } = useAuth()
  return useQuery({
    queryKey: [...NOTIF_KEY, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, type, title, body, is_read, created_at, actor_user_id')
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data as AppNotification[]
    },
    enabled: !!user,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  })
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async () => {
      if (!user) return
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_user_id', user.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTIF_KEY }),
  })
}

// Live updates — subscribe once (called in AppShell). On a new notification,
// refresh the list and pop a toast.
export function useNotificationsRealtime() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const addToast = useUIStore((s) => s.addToast)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_user_id=eq.${userId}`,
        },
        (payload) => {
          qc.invalidateQueries({ queryKey: NOTIF_KEY })
          const title = (payload.new as { title?: string })?.title
          if (title) addToast(title, 'info')
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, qc, addToast])
}
