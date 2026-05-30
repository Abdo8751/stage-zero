'use client'

import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { useMatches } from '@/hooks/useMatches'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function DashboardPage() {
  const { user, startup, loading } = useUser()
  const { matches } = useMatches('pending')

  if (loading) {
    return <div className="py-16 text-center text-muted">Loading…</div>
  }

  if (!startup) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl">Complete your profile</h1>
        <p className="mt-2 text-muted">Finish onboarding to appear in the investor feed.</p>
        <Link href="/onboarding" className="mt-6 inline-block">
          <Button>Continue onboarding</Button>
        </Link>
      </div>
    )
  }

  const profileViews = 127
  const savedCount = 8

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl">Dashboard</h1>
          <p className="mt-1 text-muted">Welcome back, {user?.full_name ?? 'Founder'}</p>
        </div>
        <Badge variant={startup.is_active ? 'success' : 'muted'}>
          {startup.is_active ? 'Active listing' : 'Paused'}
        </Badge>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <p className="text-sm text-muted">Profile views</p>
          <p className="mt-1 font-heading text-3xl">{profileViews}</p>
          <p className="mt-1 text-xs text-muted">Mock data</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Investors saved you</p>
          <p className="mt-1 font-heading text-3xl">{savedCount}</p>
          <p className="mt-1 text-xs text-muted">Mock data</p>
        </Card>
        <Card>
          <p className="text-sm text-muted">Pending interests</p>
          <p className="mt-1 font-heading text-3xl">{matches.length}</p>
          <Link href="/interests" className="mt-2 inline-block text-sm text-gold hover:underline">
            View inbox →
          </Link>
        </Card>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/profile/edit">
          <Button variant="secondary" fullWidth>
            Quick edit profile
          </Button>
        </Link>
        <Link href="/interests">
          <Button fullWidth>View interests ({matches.length})</Button>
        </Link>
      </div>

      <Card className="mt-8">
        <h2 className="text-xl">Recent activity</h2>
        <ul className="mt-4 space-y-3">
          {matches.length === 0 ? (
            <li className="text-sm text-muted">No recent activity yet. Your listing is live!</li>
          ) : (
            matches.slice(0, 5).map((m) => (
              <li key={m.id} className="flex items-center justify-between border-b border-muted/20 pb-3 text-sm last:border-0">
                <span>
                  New interest from{' '}
                  <strong>{m.investors?.users?.full_name ?? 'an investor'}</strong>
                </span>
                <span className="text-muted">
                  {new Date(m.created_at).toLocaleDateString()}
                </span>
              </li>
            ))
          )}
        </ul>
      </Card>
    </div>
  )
}
