import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

interface Profile {
  id: string
  email: string
  name: string
  avatar_emoji: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  session: Session | null
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)
        setUser(newSession?.user ?? null)
        
        if (newSession?.user) {
          // Fetch profile and roles
          setTimeout(async () => {
            await fetchProfile(newSession.user.id)
            await checkAdminRole(newSession.user.id)
          }, 0)
        } else {
          setProfile(null)
          setIsAdmin(false)
        }
        
        setIsLoading(false)
      }
    )

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession)
      setUser(initialSession?.user ?? null)
      
      if (initialSession?.user) {
        fetchProfile(initialSession.user.id)
        checkAdminRole(initialSession.user.id)
      }
      
      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function fetchProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!error && data) {
      setProfile(data)
    }
  }

  async function checkAdminRole(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle()

    setIsAdmin(!error && data !== null)
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        isLoading,
        isAdmin,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
