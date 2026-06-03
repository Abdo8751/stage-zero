'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { notify } from '@/lib/notify'
import { useUser } from '@/hooks/useUser'
import { useMatches } from '@/hooks/useMatches'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useState } from 'react'
import { Clock, User, Briefcase, MapPin, TrendingUp } from 'lucide-react'
import type { MatchWithDetails } from '@/lib/types'

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}

function InvestorCard({ match }: { match: MatchWithDetails }) {
  const inv  = match.investors
  const user = inv?.users
  const age  = daysSince(match.created_at)

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-5">
      {/* Avatar */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#F5EDDB] to-[#D5C8A8] text-[16px] font-black text-navy shadow-[0_1px_4px_rgba(0,0,0,0.3)]">
        {(user?.full_name ?? 'I')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[15px] font-bold text-cream">{user?.full_name ?? 'Verified Investor'}</p>
          <Badge variant="blue">Verified</Badge>
          {age >= 7 && age < 14 && <Badge variant="warning">Expires soon</Badge>}
          {age >= 14 && <Badge variant="rejected">Expired</Badge>}
        </div>
        {inv?.bio && <p className="mt-1 text-[13px] text-cream-muted line-clamp-2">{inv.bio}</p>}
        <div className="mt-2 flex flex-wrap gap-4 text-[12px] text-cream-subtle">
          {inv?.cheque_size && <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{inv.cheque_size}</span>}
          {inv?.location    && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{inv.location}</span>}
        </div>
        <p className="mt-2 text-[11px] text-cream-subtle">
          {age === 0 ? 'Today' : `${age} day${age !== 1 ? 's' : ''} ago`}
        </p>
      </div>
    </div>
  )
}

export default function InterestsPage() {
  const { user } = useUser()
  const { matches, loading, error, refresh } = useMatches('pending')
  const { showToast } = useToast()
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const updateMatch = async (match: MatchWithDetails, status: 'accepted' | 'declined') => {
    setActionLoading(match.id)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', match.id)
      if (updateError) throw updateError

      const investorUserId = match.investors?.user_id
      const investorName   = match.investors?.users?.full_name ?? 'The investor'
      const startupName    = match.startups?.name ?? 'your startup'

      if (status === 'accepted' && investorUserId) {
        // Notify investor — accepted
        await notify(
          investorUserId,
          'interest_accepted',
          `${startupName} accepted your interest. Chat is now open!`,
          `/chat/${match.id}`,
          'sendInterestAccepted',
          { to: match.investors?.users?.full_name ?? '', investorName, startupName, matchId: match.id },
        )
      } else if (status === 'declined' && investorUserId) {
        // Notify investor — declined
        await notify(
          investorUserId,
          'interest_declined',
          `The founder of ${startupName} has passed on your interest.`,
          '/browse',
          'sendInterestDeclined',
          { to: match.investors?.users?.full_name ?? '', investorName, startupName },
        )
      }

      showToast(status === 'accepted' ? 'Interest accepted — chat is open!' : 'Interest declined', 'success')
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Action failed', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-20 pb-16 sm:px-6">
      <div className="mb-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cream-muted">Inbox</p>
        <h1 className="text-[32px] font-black tracking-tightest text-cream">Interest requests</h1>
        <p className="mt-1 text-[14px] text-cream-muted">Review investors who want to connect with you.</p>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="shimmer h-32 rounded-card" />)}
        </div>
      )}
      {error && <p className="text-[#FF453A]">{error}</p>}

      {!loading && matches.length === 0 && (
        <Card className="py-12 text-center">
          <User className="mx-auto mb-3 h-8 w-8 text-cream-subtle" />
          <p className="text-[15px] font-bold text-cream">No pending interest requests</p>
          <p className="mt-1 text-[13px] text-cream-muted">Keep your profile active and up to date to attract investors.</p>
          <Link href="/profile/edit" className="mt-5 inline-block">
            <Button variant="secondary" size="sm">Edit your listing</Button>
          </Link>
        </Card>
      )}

      <div className="space-y-4">
        {matches.map((match) => {
          const age = daysSince(match.created_at)
          const expired = age >= 14
          return (
            <Card key={match.id} className={expired ? 'opacity-60' : ''}>
              <InvestorCard match={match} />
              {!expired && (
                <div className="mt-4 flex flex-col gap-2 border-t border-[rgba(240,230,208,0.06)] pt-4 sm:flex-row">
                  <Button
                    onClick={() => updateMatch(match, 'accepted')}
                    disabled={!!actionLoading}
                    fullWidth
                    size="sm"
                  >
                    {actionLoading === match.id ? 'Processing…' : 'Accept — unlock chat'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => updateMatch(match, 'declined')}
                    disabled={!!actionLoading}
                    fullWidth
                    size="sm"
                  >
                    Decline
                  </Button>
                </div>
              )}
              {expired && (
                <p className="mt-4 border-t border-[rgba(240,230,208,0.06)] pt-4 text-[12px] text-cream-subtle">
                  This request has expired (14+ days old).
                </p>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
