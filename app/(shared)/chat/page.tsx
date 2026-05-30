'use client'

import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useMatches } from '@/hooks/useMatches'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

export default function ChatListPage() {
  const { user } = useUser()
  const { matches, loading, error } = useMatches('accepted')

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">Chat</h1>
      <p className="mt-2 text-muted">Conversations with accepted matches</p>

      {loading && <p className="mt-8 text-muted">Loading…</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}

      {!loading && matches.length === 0 && (
        <div className="mt-12 text-center text-muted">
          <p>No active conversations yet.</p>
          <p className="mt-2 text-sm">
            {user?.role === 'founder'
              ? 'Accept investor interest to unlock chat.'
              : 'Express interest and wait for founder acceptance.'}
          </p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {matches.map((match) => {
          const title =
            user?.role === 'founder'
              ? match.investors?.users?.full_name ?? 'Investor'
              : match.startups?.name ?? 'Startup'

          return (
            <Link key={match.id} href={`/chat/${match.id}`}>
              <Card className="transition-colors hover:border-gold/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="text-sm text-muted">
                      {match.is_deal_closed ? 'Deal closed' : 'Active conversation'}
                    </p>
                  </div>
                  {match.is_deal_closed ? (
                    <Badge variant="muted">Closed</Badge>
                  ) : (
                    <Badge variant="success">Open</Badge>
                  )}
                </div>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
