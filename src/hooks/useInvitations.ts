import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

interface Invitation {
  id: string
  email: string
  invited_by: string | null
  created_at: string
}

export function useInvitations() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['invitations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invited_emails')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Invitation[]
    },
  })

  const addMutation = useMutation({
    mutationFn: async (email: string) => {
      const { data, error } = await supabase
        .from('invited_emails')
        .insert({ email, invited_by: user?.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('invited_emails')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })

  return {
    invitations,
    isLoading,
    addInvitation: addMutation.mutateAsync,
    removeInvitation: removeMutation.mutate,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  }
}
