'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useMatches } from '@/hooks/useMatches'
import { createClient } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { STARTUP_STAGES, type StartupStatus } from '@/lib/types'
import {
  AlertCircle,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Inbox,
  MapPin,
  MessageSquare,
  Search,
  Settings,
  Sparkles,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'

function stageLabel(stage: string) {
  return STARTUP_STAGES.find((item) => item.value === stage)?.label ?? stage
}

function formatRaise(amount: number | null) {
  if (!amount) return 'Undisclosed'
  if (amount >= 1_000_000) return `EGP ${(amount / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
  return `EGP ${(amount / 1_000).toFixed(0)}K`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: StartupStatus }) {
  const map: Record<
    StartupStatus,
    { label: string; variant: 'success' | 'gold' | 'muted' | 'rejected' | 'blue' }
  > = {
    active: { label: 'Live', variant: 'success' },
    pending_review: { label: 'Pending review', variant: 'gold' },
    paused: { label: 'Paused', variant: 'muted' },
    rejected: { label: 'Not approved', variant: 'rejected' },
    changes_requested: { label: 'Changes requested', variant: 'blue' },
  }
  const item = map[status] ?? { label: status, variant: 'muted' as const }
  return <Badge variant={item.variant}>{item.label}</Badge>
}

function AvatarDisplay({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null
  name: string | null
}) {
  const initials = (name ?? '?')
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  if (avatarUrl) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-paper shadow-[0_0_0_1px_rgba(8,10,20,.12)]">
        <Image
          src={avatarUrl}
          alt={name ?? 'Founder'}
          width={48}
          height={48}
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-blue-accent/25 bg-blue-accent/10 text-[14px] font-black text-blue-accent">
      {initials}
    </div>
  )
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  href,
}: {
  label: string
  value: number
  note: string
  icon: LucideIcon
  href?: string
}) {
  const content = (
    <Card className="h-full transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-accent/25">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/45">
            {label}
          </p>
          <p className="mt-4 font-serif text-[42px] leading-none tracking-[-.05em] text-ink">
            {value}
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-accent/15 bg-blue-accent/[.08]">
          <Icon className="h-4 w-4 text-blue-accent" />
        </span>
      </div>
      <p className="mt-4 text-[12px] leading-5 text-ink/50">{note}</p>
    </Card>
  )

  return href ? (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  ) : (
    content
  )
}

export default function DashboardPage() {
  const { user, startup, loading } = useUser()
  const {
    matches,
    loading: matchesLoading,
    error: matchesError,
    refresh: refreshMatches,
  } = useMatches('pending')
  const [acceptedMatches, setAcceptedMatches] = useState(0)
  const [saveCount, setSaveCount] = useState(0)
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!startup) {
      setStatsLoading(false)
      return
    }

    setStatsLoading(true)
    setStatsError(null)

    try {
      const supabase = createClient()
      const [acceptedResult, savedResult] = await Promise.all([
        supabase
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .eq('startup_id', startup.id)
          .eq('status', 'accepted'),
        supabase
          .from('saved_startups')
          .select('id', { count: 'exact', head: true })
          .eq('startup_id', startup.id),
      ])

      if (acceptedResult.error) throw acceptedResult.error
      if (savedResult.error) throw savedResult.error

      setAcceptedMatches(acceptedResult.count ?? 0)
      setSaveCount(savedResult.count ?? 0)
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Marketplace activity could not be loaded.')
    } finally {
      setStatsLoading(false)
    }
  }, [startup])

  useEffect(() => {
    void fetchStats()
  }, [fetchStats])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-5 px-4 pb-12 pt-28 sm:px-6">
        <div className="shimmer h-28 rounded-card" />
        <div className="shimmer h-40 rounded-card" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="shimmer h-40 rounded-card" />
          ))}
        </div>
        <div className="shimmer h-72 rounded-card" />
      </div>
    )
  }

  if (!startup) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />
        <Card className="w-full max-w-md p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-blue-accent/25 bg-blue-accent/10">
            <Sparkles className="h-6 w-6 text-blue-accent" />
          </div>
          <h1 className="font-serif text-[34px] font-semibold tracking-[-.04em] text-ink">
            Complete your startup
          </h1>
          <p className="mt-3 text-[14px] leading-6 text-ink/60">
            Finish onboarding so the Stage Zero team can review your profile.
          </p>
          <Link href="/onboarding" className="mt-6 block">
            <Button fullWidth>
              Continue onboarding <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </div>
    )
  }

  const status = (startup.status ?? 'pending_review') as StartupStatus
  const firstName = user?.full_name?.split(' ')[0] ?? 'Founder'
  const memberSince = user?.created_at ? formatDate(user.created_at) : null
  const activityUnavailable = status !== 'active'
  const activityNote = (emptyCopy: string) =>
    activityUnavailable ? 'Marketplace activity begins when your listing is live.' : emptyCopy

  const statusContent: Record<
    StartupStatus,
    {
      eyebrow: string
      title: string
      description: string
      className: string
      iconClassName: string
    }
  > = {
    pending_review: {
      eyebrow: 'Review in progress',
      title: 'Your startup profile is pending review.',
      description:
        'Your information is saved. We will let you know when the listing is ready for approved investors.',
      className: 'border-amber/30 bg-amber/[.08]',
      iconClassName: 'border-amber/25 bg-amber/10 text-amber',
    },
    active: {
      eyebrow: 'Marketplace status',
      title: 'Your startup is live.',
      description:
        'Approved investors can now discover your profile and express interest in a private introduction.',
      className: 'border-emerald-700/20 bg-emerald-50/70',
      iconClassName: 'border-emerald-700/20 bg-emerald-100 text-emerald-700',
    },
    paused: {
      eyebrow: 'Marketplace status',
      title: 'Your startup listing is paused.',
      description:
        'Your information is still saved, but the listing is not currently visible in Browse.',
      className: 'border-ink/12 bg-paper/70',
      iconClassName: 'border-ink/10 bg-warm-cream text-ink/55',
    },
    changes_requested: {
      eyebrow: 'Action needed',
      title: 'A few changes are needed before your listing can go live.',
      description:
        startup.rejection_reason ??
        'Review the feedback, update your startup profile, and resubmit it for review.',
      className: 'border-blue-accent/25 bg-blue-accent/[.07]',
      iconClassName: 'border-blue-accent/20 bg-blue-accent/10 text-blue-accent',
    },
    rejected: {
      eyebrow: 'Review decision',
      title: 'Your startup was not approved.',
      description:
        startup.rejection_reason ??
        'Review the decision, update your startup information, and resubmit when ready.',
      className: 'border-red-700/20 bg-red-50/70',
      iconClassName: 'border-red-700/15 bg-red-100 text-red-700',
    },
  }

  const currentStatus = statusContent[status]

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-28 sm:px-6">
      <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />

      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-blue-accent">
            Founder workspace
          </p>
          <h1 className="mt-4 font-serif text-[clamp(2.7rem,6vw,4.5rem)] font-semibold leading-[.95] tracking-[-.05em] text-ink">
            Your startup at a glance.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-6 text-ink/60">
            Welcome back, {firstName}. Keep your profile current and follow every serious investor
            introduction from one calm workspace.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile/edit">
            <Button variant="secondary" size="sm">
              <Edit3 className="h-3.5 w-3.5" />
              Edit startup
            </Button>
          </Link>
          <Link href="/interests">
            <Button size="sm">
              <Inbox className="h-3.5 w-3.5" />
              View interests
              {matches.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-navy px-1 text-[9px] font-black text-white">
                  {matches.length > 9 ? '9+' : matches.length}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      <Card className="mt-8" padding="sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <AvatarDisplay avatarUrl={user?.avatar_url ?? null} name={user?.full_name ?? null} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[14px] font-bold text-ink">{user?.full_name ?? 'Founder'}</p>
                <Badge variant="blue">Founder</Badge>
              </div>
              <p className="mt-1 text-[12px] text-ink/50">
                {startup.name}
                {memberSince ? ` · Member since ${memberSince}` : ''}
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </Card>

      <section
        className={`mt-5 rounded-card border p-5 sm:p-7 ${currentStatus.className}`}
        aria-labelledby="startup-status-title"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex max-w-3xl items-start gap-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${currentStatus.iconClassName}`}
            >
              {status === 'active' ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </span>
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-ink/45">
                {currentStatus.eyebrow}
              </p>
              <h2
                id="startup-status-title"
                className="mt-2 font-serif text-[clamp(1.7rem,4vw,2.5rem)] font-semibold leading-tight tracking-[-.035em] text-ink"
              >
                {currentStatus.title}
              </h2>
              <p className="mt-2 max-w-2xl text-[13px] leading-6 text-ink/60">
                {currentStatus.description}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {status === 'active' && (
              <Link href={`/startup/${startup.id}`}>
                <Button size="sm">
                  View live listing <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            <Link href="/profile/edit">
              <Button variant={status === 'active' ? 'secondary' : 'primary'} size="sm">
                {status === 'rejected' || status === 'changes_requested'
                  ? 'Edit & resubmit'
                  : 'Edit startup'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-5" aria-labelledby="activity-heading">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-ink/40">
              Marketplace activity
            </p>
            <h2
              id="activity-heading"
              className="mt-2 font-serif text-[28px] font-semibold tracking-[-.035em] text-ink"
            >
              What investors are doing
            </h2>
          </div>
          {(statsError || matchesError) && (
            <button
              type="button"
              onClick={() => void Promise.all([fetchStats(), refreshMatches()])}
              className="text-[12px] font-semibold text-red-700 transition hover:text-red-900"
            >
              Some activity could not load · Retry
            </button>
          )}
        </div>

        {statsLoading || matchesLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="shimmer h-40 rounded-card" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Profile views"
              value={startup.view_count ?? 0}
              note={activityNote(
                startup.view_count > 0 ? 'Recorded listing views.' : 'No profile views recorded yet.',
              )}
              icon={Eye}
            />
            <MetricCard
              label="Saved by investors"
              value={saveCount}
              note={activityNote(
                saveCount > 0 ? 'Investors have saved this startup.' : 'No investors have saved it yet.',
              )}
              icon={Bookmark}
            />
            <MetricCard
              label="Pending interest"
              value={matches.length}
              note={activityNote(
                matches.length > 0
                  ? 'Requests waiting for your response.'
                  : 'No requests need your attention.',
              )}
              icon={Inbox}
              href="/interests"
            />
            <MetricCard
              label="Accepted matches"
              value={acceptedMatches}
              note={activityNote(
                acceptedMatches > 0
                  ? 'Private conversations are open.'
                  : 'No investor conversations are open yet.',
              )}
              icon={MessageSquare}
              href="/chat"
            />
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,.75fr)]">
        <section aria-labelledby="listing-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-ink/40">
                Startup profile
              </p>
              <h2
                id="listing-heading"
                className="mt-2 font-serif text-[30px] font-semibold tracking-[-.035em] text-ink"
              >
                Your listing
              </h2>
            </div>
            <Link href="/profile/edit">
              <Button variant="ghost" size="sm">
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>
          </div>

          <Card className="h-[calc(100%-4.75rem)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[15px] border border-blue-accent/20 bg-blue-accent/10 font-serif text-[24px] font-semibold text-blue-accent">
                  {startup.name[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif text-[29px] font-semibold tracking-[-.035em] text-ink">
                    {startup.name}
                  </h3>
                  {startup.tagline && (
                    <p className="mt-1 max-w-xl text-[14px] leading-6 text-ink/60">
                      {startup.tagline}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
                    {startup.sector.map((sector) => (
                      <Badge key={sector} variant="muted">
                        {sector}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <StatusBadge status={status} />
            </div>

            {(startup.problem || startup.solution || startup.traction) && (
              <div className="mt-6 grid gap-5 border-t border-ink/10 pt-6 sm:grid-cols-2">
                {startup.problem && (
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/40">
                      Problem
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-ink/65">{startup.problem}</p>
                  </div>
                )}
                {startup.solution && (
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/40">
                      Solution
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-ink/65">{startup.solution}</p>
                  </div>
                )}
                {startup.traction && (
                  <div className="sm:col-span-2">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/40">
                      Traction
                    </p>
                    <p className="mt-2 text-[13px] leading-6 text-ink/65">{startup.traction}</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-4 border-t border-ink/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-x-10 gap-y-4">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/40">
                    Current raise
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-ink">
                    {formatRaise(startup.raise_amount)}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/40">
                    Team size
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-ink">
                    {startup.team_size}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[.12em] text-ink/40">
                    Co-founders
                  </p>
                  <p className="mt-1 text-[15px] font-bold text-ink">
                    {startup.cofounder_count}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {startup.website_url && (
                  <a
                    href={startup.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-ink/55 transition hover:text-ink"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {startup.pitch_deck_url && (
                  <a
                    href={startup.pitch_deck_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[12px] font-semibold text-blue-accent transition hover:text-blue-bright"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Pitch deck
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </Card>
        </section>

        <aside className="space-y-6">
          <section aria-labelledby="recent-interest-heading">
            <div className="mb-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-ink/40">
                Introductions
              </p>
              <h2
                id="recent-interest-heading"
                className="mt-2 font-serif text-[30px] font-semibold tracking-[-.035em] text-ink"
              >
                Recent interest
              </h2>
            </div>
            <Card>
              {matchesError ? (
                <div className="py-5 text-center">
                  <p className="text-[13px] text-red-700">Investor interest could not be loaded.</p>
                </div>
              ) : matchesLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((item) => (
                    <div key={item} className="shimmer h-16 rounded-xl" />
                  ))}
                </div>
              ) : matches.length === 0 ? (
                <div className="py-5 text-center">
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-warm-cream">
                    <Inbox className="h-4 w-4 text-amber" />
                  </span>
                  <p className="mt-4 text-[14px] font-bold text-ink">No interest received yet</p>
                  <p className="mt-2 text-[12px] leading-5 text-ink/50">
                    {status === 'active'
                      ? 'New verified investor requests will appear here.'
                      : 'Requests can begin once your listing is live.'}
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-ink/10">
                  {matches.slice(0, 4).map((match) => {
                    const investorName = match.investors?.users?.full_name ?? 'Verified investor'
                    return (
                      <li key={match.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-blue-accent/15 bg-blue-accent/[.08] text-[11px] font-black text-blue-accent">
                            {investorName[0]?.toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold text-ink">{investorName}</p>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-ink/45">
                              {match.investors?.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {match.investors.location}
                                </span>
                              )}
                              {match.investors?.cheque_size && (
                                <span>{match.investors.cheque_size}</span>
                              )}
                              <span>{formatDate(match.created_at)}</span>
                            </div>
                            <Link
                              href="/interests"
                              className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-accent hover:underline"
                            >
                              View request <ArrowRight className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
              <Link
                href="/interests"
                className="mt-5 flex items-center justify-between border-t border-ink/10 pt-4 text-[12px] font-bold text-ink/60 transition hover:text-ink"
              >
                View all interests <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Card>
          </section>

          <section aria-labelledby="quick-actions-heading">
            <h2
              id="quick-actions-heading"
              className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-ink/40"
            >
              Quick actions
            </h2>
            <Card padding="sm">
              <nav className="divide-y divide-ink/10" aria-label="Founder quick actions">
                {[
                  { href: '/profile/edit', label: 'Edit startup', icon: Edit3 },
                  { href: '/interests', label: 'View interests', icon: Inbox },
                  { href: '/chat', label: 'Open founder chats', icon: MessageSquare },
                  { href: '/browse', label: 'Browse startups', icon: Search },
                  { href: '/settings', label: 'Account settings', icon: Settings },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 py-3 text-[12px] font-semibold text-ink/60 transition first:pt-1 last:pb-1 hover:text-ink"
                  >
                    <item.icon className="h-3.5 w-3.5 text-blue-accent" />
                    <span className="flex-1">{item.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink/30" />
                  </Link>
                ))}
                {status === 'active' && (
                  <Link
                    href={`/startup/${startup.id}`}
                    className="flex items-center gap-3 py-3 text-[12px] font-semibold text-ink/60 transition last:pb-1 hover:text-ink"
                  >
                    <TrendingUp className="h-3.5 w-3.5 text-blue-accent" />
                    <span className="flex-1">View live listing</span>
                    <ArrowRight className="h-3.5 w-3.5 text-ink/30" />
                  </Link>
                )}
              </nav>
            </Card>
          </section>
        </aside>
      </div>
    </div>
  )
}
