import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { MatchWithDetails } from '@/lib/types'

interface MatchCardProps {
  match: MatchWithDetails
  view: 'founder' | 'investor'
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
  loading?: boolean
}

function isExpired(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays > 7
}

export function MatchCard({ match, view, onAccept, onDecline, loading }: MatchCardProps) {
  const investorUser = match.investors?.users
  const startup = match.startups
  const expired = match.status === 'pending' && isExpired(match.created_at)

  return (
    <Card hoverable>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white font-medium text-lg">
            {view === 'founder'
              ? investorUser?.full_name?.[0] ?? '?'
              : startup?.name?.[0] ?? '?'}
          </div>
          <div>
            <h3 className="text-lg font-heading text-white">
              {view === 'founder'
                ? investorUser?.full_name ?? 'Investor'
                : startup?.name ?? 'Startup'}
            </h3>
            {view === 'founder' && match.investors?.bio && (
              <p className="mt-1 line-clamp-2 text-sm text-[rgba(255,255,255,0.55)] font-body font-light">{match.investors.bio}</p>
            )}
            {view === 'founder' && match.investors?.cheque_size && (
              <p className="mt-1 text-sm text-gold font-body font-normal">Cheque: {match.investors.cheque_size}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge
                variant={
                  match.status === 'accepted'
                    ? 'success'
                    : match.status === 'declined'
                      ? 'rejected'
                      : 'pending'
                }
              >
                {match.status}
              </Badge>
              {expired && <Badge variant="warning">Expired</Badge>}
            </div>
          </div>
        </div>

        {view === 'founder' && match.status === 'pending' && onAccept && onDecline && (
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button size="sm" disabled={loading} onClick={() => onAccept(match.id)}>
              Accept
            </Button>
            <Button size="sm" variant="destructive" disabled={loading} onClick={() => onDecline(match.id)}>
              Decline
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
