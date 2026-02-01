import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useUserStore } from '@/stores/userStore'
import type { AppUser, AppUserInsert, AppUserUpdate } from '@/types/database'

const USERS_KEY = ['users']

export function useUsers() {
  const { setUsers, setCurrentUser, currentUser, setLoading } = useUserStore()

  const query = useQuery({
    queryKey: USERS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('name')

      if (error) throw error
      return data as AppUser[]
    },
  })

  // Update the store when users are fetched
  useEffect(() => {
    if (query.data) {
      setUsers(query.data)
      // Auto-select first user if none selected
      if (!currentUser && query.data.length > 0) {
        setCurrentUser(query.data[0])
      }
      setLoading(false)
    }
  }, [query.data, currentUser, setUsers, setCurrentUser, setLoading])

  return query
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (user: AppUserInsert) => {
      const { data, error } = await supabase
        .from('app_users')
        .insert(user)
        .select()
        .single()

      if (error) throw error
      return data as AppUser
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  const { currentUser, setCurrentUser } = useUserStore()

  return useMutation({
    mutationFn: async ({ id, ...updates }: AppUserUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('app_users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as AppUser
    },
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      // Update current user if we just updated them
      if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser)
      }
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  const { currentUser, setCurrentUser, users } = useUserStore()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('app_users').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY })
      // If we deleted the current user, switch to another user
      if (currentUser?.id === deletedId) {
        const remainingUsers = users.filter((u) => u.id !== deletedId)
        setCurrentUser(remainingUsers[0] || null)
      }
    },
  })
}
