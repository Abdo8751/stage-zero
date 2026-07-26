'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ChatWindow } from '@/components/ChatWindow'
import { useUser } from '@/hooks/useUser'
import { useMatches } from '@/hooks/useMatches'
import { useToast } from '@/components/ui/Toast'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Building2, MessageSquare, UserRound } from 'lucide-react'

export default function ChatDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string
  const { user, loading: userLoading } = useUser()
  const { matches, loading: matchesLoading, error } = useMatches('accepted')
  const { showToast } = useToast()
  const match = matches.find((item) => item.id === matchId)
  const isFounder = user?.role === 'founder'

  const handleDealClosed = async () => {
    if (!confirm('Mark this deal as closed?')) return
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('matches')
        .update({ is_deal_closed: true, updated_at: new Date().toISOString() })
        .eq('id', matchId)
      if (updateError) throw updateError
      showToast('Deal marked as closed', 'success')
      router.push('/chat')
    } catch (updateError) {
      showToast(updateError instanceof Error ? updateError.message : 'Failed to update', 'error')
    }
  }

  const handleReport = () => showToast('Report submitted. Our team will review.', 'info')

  if (userLoading || matchesLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-28 sm:px-6">
        <div className="shimmer h-24 rounded-card" />
        <div className="mt-5 shimmer h-[600px] rounded-[28px]" />
      </div>
    )
  }

  if (!user) {
    return <div className="py-32 text-center text-ink/55">Loading…</div>
  }

  if (error || !match) {
    return (
      <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-32 text-center sm:px-6">
        <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />
        <Card className={error ? 'border-red-700/20 bg-red-50/70' : ''}>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warm-cream">
            <MessageSquare className="h-5 w-5 text-ink/45" />
          </span>
          <h1 className="mt-5 font-serif text-3xl font-semibold tracking-[-.035em] text-ink">
            Conversation unavailable
          </h1>
          <p className="mt-3 text-[13px] leading-6 text-ink/55">
            {error
              ? 'We could not load this conversation right now.'
              : 'This conversation is not part of your accepted matches.'}
          </p>
          <Link
            href="/chat"
            className="mt-5 inline-flex items-center gap-2 text-[13px] font-bold text-blue-accent hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to chats
          </Link>
        </Card>
      </div>
    )
  }

  const investorName = match.investors?.users?.full_name ?? 'Verified investor'
  const startupName = match.startups?.name ?? 'Startup'
  const founderName = match.startups?.users?.full_name ?? 'Founder'
  const counterpart = isFounder ? investorName : startupName
  const context = isFounder
    ? `Investor introduction for ${startupName}`
    : `Founder: ${founderName}`

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 pt-28 sm:px-6">
      <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />
      <Link
        href="/chat"
        className="inline-flex items-center gap-2 text-[12px] font-semibold text-ink/55 transition hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to {isFounder ? 'founder chats' : 'startup chats'}
      </Link>

      <Card className="mt-5" padding="sm">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-accent/15 bg-blue-accent/[.08] text-[14px] font-black text-blue-accent">
            {counterpart[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate font-serif text-[28px] font-semibold tracking-[-.035em] text-ink">
                {counterpart}
              </h1>
              <Badge variant={match.is_deal_closed ? 'muted' : 'success'}>
                {match.is_deal_closed ? 'Closed' : 'Open'}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink/50">
              {isFounder ? (
                <UserRound className="h-3.5 w-3.5" />
              ) : (
                <Building2 className="h-3.5 w-3.5" />
              )}
              {context}
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-5">
        <ChatWindow
          matchId={matchId}
          currentUserId={user.id}
          onDealClosed={match.is_deal_closed ? undefined : handleDealClosed}
        />
      </div>
      <button
        type="button"
        onClick={handleReport}
        className="mt-4 text-xs font-medium text-ink/45 transition hover:text-red-700"
      >
        Report user
      </button>
    </div>
  )
}
