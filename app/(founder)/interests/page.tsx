'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { addNotification } from '@/lib/auth'
import { useMatches } from '@/hooks/useMatches'
import { MatchCard } from '@/components/MatchCard'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useState } from 'react'

export default function InterestsPage() {
  const { matches, loading, error, refresh } = useMatches('pending')
  const { showToast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const updateMatch = async (id: string, status: 'accepted' | 'declined') => {
    setActionLoading(id)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (updateError) throw updateError

      addNotification({
        type: status === 'accepted' ? 'match_accepted' : 'match_declined',
        title: status === 'accepted' ? 'Match accepted' : 'Match declined',
        body: `You ${status} an investor interest request.`,
      })

      showToast(status === 'accepted' ? 'Interest accepted — chat unlocked!' : 'Interest declined', 'success')
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">Interest inbox</h1>
      <p className="mt-2 text-muted">Review investors who want to connect</p>

      {loading && <p className="mt-8 text-muted">Loading…</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}

      {!loading && matches.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-muted">No pending interest requests yet.</p>
          <p className="mt-2 text-sm text-muted">Keep your profile active to attract investors.</p>
          <Link href="/profile/edit" className="mt-6 inline-block">
            <Button variant="secondary">Edit your listing</Button>
          </Link>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            view="founder"
            loading={actionLoading === match.id}
            onAccept={(id) => updateMatch(id, 'accepted')}
            onDecline={(id) => updateMatch(id, 'declined')}
          />
        ))}
      </div>
    </div>
  )
}
