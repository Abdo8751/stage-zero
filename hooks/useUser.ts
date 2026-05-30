'use client'

import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase'
import type { Investor, Startup, User } from '@/lib/types'

interface UseUserReturn {
  session: Session | null
  user: User | null
  startup: Startup | null
  investor: Investor | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [startup, setStartup] = useState<Startup | null>(null)
  const [investor, setInvestor] = useState<Investor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) throw sessionError
      setSession(currentSession)

      if (!currentSession?.user) {
        setUser(null)
        setStartup(null)
        setInvestor(null)
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentSession.user.id)
        .maybeSingle()

      if (profileError) throw profileError

      if (!profile) {
        setUser(null)
        setStartup(null)
        setInvestor(null)
        return
      }

      setUser(profile as User)

      if (profile.role === 'founder') {
        const { data: startupData, error: startupError } = await supabase
          .from('startups')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .maybeSingle()

        if (startupError) throw startupError
        setStartup(startupData as Startup | null)
        setInvestor(null)
      } else {
        const { data: investorData, error: investorError } = await supabase
          .from('investors')
          .select('*')
          .eq('user_id', currentSession.user.id)
          .maybeSingle()

        if (investorError) throw investorError
        setInvestor(investorData as Investor | null)
        setStartup(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchProfile()

    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void fetchProfile()
    })

    return () => subscription.unsubscribe()
  }, [])

  return {
    session,
    user,
    startup,
    investor,
    loading,
    error,
    refresh: fetchProfile,
  }
}
