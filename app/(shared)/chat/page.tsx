'use client'

import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useMatches } from '@/hooks/useMatches'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowRight, Building2, MessageSquare, UserRound } from 'lucide-react'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function ChatListPage() {
  const { user, loading: userLoading } = useUser()
  const { matches, loading: matchesLoading, error } = useMatches('accepted')
  const isFounder = user?.role === 'founder'
  const loading = userLoading || matchesLoading

  return (
    <div className="relative mx-auto w-full max-w-5xl px-4 pb-20 pt-28 sm:px-6">
      <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />

      <header className="max-w-2xl">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-blue-accent">
          {isFounder ? 'Founder workspace · Private introductions' : 'Investor workspace · Matches'}
        </p>
        <h1 className="mt-4 font-serif text-[clamp(2.8rem,7vw,4.75rem)] font-semibold leading-[.95] tracking-[-.05em] text-ink">
          {isFounder ? 'Founder conversations.' : 'Startup conversations.'}
        </h1>
        <p className="mt-4 text-[15px] leading-6 text-ink/60">
          {isFounder
            ? 'Conversations open after you accept an investor interest request.'
            : 'Talk directly with founders who accepted your interest.'}
        </p>
      </header>

      {loading && (
        <div className="mt-10 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="shimmer h-28 rounded-card" />
          ))}
        </div>
      )}

      {!loading && error && (
        <Card className="mt-10 border-red-700/20 bg-red-50/70 text-center">
          <p className="text-[14px] font-semibold text-red-700">Conversations could not be loaded.</p>
          <p className="mt-1 text-[12px] text-red-700/70">{error}</p>
        </Card>
      )}

      {!loading && !error && matches.length === 0 && (
        <Card className="mt-10 py-12 text-center sm:py-16">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-blue-accent/15 bg-blue-accent/[.08]">
            <MessageSquare className="h-5 w-5 text-blue-accent" />
          </span>
          <p className="mt-5 font-serif text-3xl font-semibold tracking-[-.035em] text-ink">
            No active conversations yet
          </p>
          <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-ink/55">
            {isFounder
              ? 'Review investor interest and accept a request when the introduction feels right.'
              : 'Browse approved startups and express interest. Chat opens only after a founder accepts.'}
          </p>
          <Link href={isFounder ? '/interests' : '/browse'} className="mt-6 inline-block">
            <Button size="sm">
              {isFounder ? 'View investor interests' : 'Browse startups'}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      )}

      {!loading && !error && matches.length > 0 && (
        <section className="mt-10" aria-labelledby="conversation-list-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="conversation-list-heading"
              className="font-serif text-[28px] font-semibold tracking-[-.035em] text-ink"
            >
              Open conversations
            </h2>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/40">
              {matches.length} {matches.length === 1 ? 'match' : 'matches'}
            </span>
          </div>

          <div className="space-y-3">
            {matches.map((match) => {
              const investorName = match.investors?.users?.full_name ?? 'Verified investor'
              const startupName = match.startups?.name ?? 'Startup'
              const founderName = match.startups?.users?.full_name ?? 'Founder'
              const title = isFounder ? investorName : startupName
              const context = isFounder
                ? `Interested in ${startupName}`
                : `Founded by ${founderName}`

              return (
                <Link key={match.id} href={`/chat/${match.id}`} className="block">
                  <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-accent/30 hover:shadow-[0_16px_38px_rgba(8,10,20,.08)]">
                    <div className="flex items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-accent/15 bg-blue-accent/[.08] text-[14px] font-black text-blue-accent">
                        {title[0]?.toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate font-serif text-[24px] font-semibold tracking-[-.03em] text-ink">
                            {title}
                          </h3>
                          <Badge variant={match.is_deal_closed ? 'muted' : 'success'}>
                            {match.is_deal_closed ? 'Closed' : 'Open'}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-[12px] text-ink/55">
                          {isFounder ? (
                            <UserRound className="h-3.5 w-3.5" />
                          ) : (
                            <Building2 className="h-3.5 w-3.5" />
                          )}
                          <span className="truncate">{context}</span>
                        </p>
                      </div>
                      <div className="hidden shrink-0 text-right sm:block">
                        <p className="font-mono text-[10px] uppercase tracking-[.08em] text-ink/35">
                          Matched
                        </p>
                        <p className="mt-1 text-[11px] text-ink/50">{formatDate(match.updated_at)}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink/25 transition group-hover:translate-x-1 group-hover:text-blue-accent" />
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
