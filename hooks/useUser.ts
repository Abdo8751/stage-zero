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
        let startupData: Startup | null = null

        // Try the service-role API route first (bypasses RLS, shows pending/inactive startups)
        try {
          const res = await fetch('/api/founder/startup', {
            headers: { Authorization: `Bearer ${currentSession.access_token}` },
          })
          if (res.ok) {
            const body = (await res.json()) as { startup: Startup | null }
            startupData = body.startup
          }
        } catch {
          // API unavailable — fall through to direct query below
        }

        // Fallback: direct Supabase query (works once the RLS fix in supabase_migrations.sql is applied)
        if (!startupData) {
          const { data } = await supabase
            .from('startups')
            .select('*')
            .eq('user_id', currentSession.user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          startupData = (data as Startup | null)
        }

        setStartup(startupData)
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
