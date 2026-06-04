'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { MatchWithDetails } from '@/lib/types'

interface UseMatchesReturn {
  matches: MatchWithDetails[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useMatches(filter?: 'pending' | 'accepted' | 'all'): UseMatchesReturn {
  const [matches, setMatches] = useState<MatchWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) throw authError
      if (!user) {
        setMatches([])
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) throw profileError

      let query = supabase
        .from('matches')
        .select(
          `*, startups(*, users(full_name, avatar_url, email)), investors(*, users(full_name, avatar_url))`
        )
        .order('created_at', { ascending: false })

      if (filter && filter !== 'all') {
        query = query.eq('status', filter)
      }

      if (profile.role === 'founder') {
        const { data: startup, error: startupError } = await supabase
          .from('startups')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (startupError) throw startupError
        if (!startup) {
          setMatches([])
          return
        }
        query = query.eq('startup_id', startup.id)
      } else {
        const { data: investor, error: investorError } = await supabase
          .from('investors')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (investorError) throw investorError
        if (!investor) {
          setMatches([])
          return
        }
        query = query.eq('investor_id', investor.id)
      }

      const { data, error: matchError } = await query
      if (matchError) throw matchError

      setMatches((data ?? []) as MatchWithDetails[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { matches, loading, error, refresh }
}
