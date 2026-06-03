'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useMatches } from '@/hooks/useMatches'
import { createClient } from '@/lib/supabase'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { STARTUP_STAGES, STARTUP_STATUS_LABELS, type StartupStatus } from '@/lib/types'
import {
  Edit3, Eye, Bookmark, TrendingUp, ExternalLink,
  FileText, Globe, ArrowRight, Zap, Calendar,
  AlertCircle, CheckCircle2, Clock, RefreshCw,
} from 'lucide-react'

function stageLabel(stage: string) {
  return STARTUP_STAGES.find((s) => s.value === stage)?.label ?? stage
}

function formatRaise(amount: number | null) {
  if (!amount) return 'Undisclosed'
  if (amount >= 1_000_000) return `EGP ${(amount / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
  return `EGP ${(amount / 1_000).toFixed(0)}K`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function StatusBadge({ status }: { status: StartupStatus }) {
  const map: Record<StartupStatus, { label: string; variant: 'success' | 'gold' | 'muted' | 'rejected' | 'blue' }> = {
    active:             { label: 'Active',             variant: 'success' },
    pending_review:     { label: 'Pending review',     variant: 'gold' },
    paused:             { label: 'Paused',             variant: 'muted' },
    rejected:           { label: 'Rejected',           variant: 'rejected' },
    changes_requested:  { label: 'Changes requested',  variant: 'blue' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'muted' }
  return <Badge variant={variant}>{label}</Badge>
}

function AvatarDisplay({ avatarUrl, name, size = 'lg' }: { avatarUrl: string | null; name: string | null; size?: 'sm' | 'lg' }) {
  const initials = (name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const dim = size === 'lg' ? 'h-20 w-20' : 'h-10 w-10'
  const text = size === 'lg' ? 'text-[28px]' : 'text-[14px]'
  if (avatarUrl) {
    return (
      <div className={`${dim} rounded-full overflow-hidden border-2 border-[rgba(240,230,208,0.15)] shadow-[0_0_0_4px_rgba(75,124,246,0.15)]`}>
        <Image src={avatarUrl} alt={name ?? ''} width={80} height={80} className="h-full w-full object-cover" />
      </div>
    )
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-[rgba(75,124,246,0.3)] to-[rgba(75,124,246,0.10)] border-2 border-[rgba(75,124,246,0.35)] shadow-[0_0_0_4px_rgba(75,124,246,0.10)] flex items-center justify-center`}>
      <span className={`${text} font-black text-blue-bright`}>{initials}</span>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user, startup, loading } = useUser()
  const { matches } = useMatches('pending')
  const [acceptedMatches, setAcceptedMatches] = useState(0)
  const [saveCount, setSaveCount] = useState(0)

  const fetchStats = useCallback(async () => {
    if (!startup) return
    const supabase = createClient()

    const [{ count: accepted }, { count: saved }] = await Promise.all([
      supabase.from('matches').select('id', { count: 'exact', head: true }).eq('startup_id', startup.id).eq('status', 'accepted'),
      supabase.from('saved_startups').select('id', { count: 'exact', head: true }).eq('startup_id', startup.id),
    ])
    setAcceptedMatches(accepted ?? 0)
    setSaveCount(saved ?? 0)
  }, [startup])

  useEffect(() => { void fetchStats() }, [fetchStats])

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 pt-24 pb-12 space-y-4">
        <div className="shimmer h-32 rounded-card" />
        <div className="grid gap-4 sm:grid-cols-3">{[1,2,3].map(i => <div key={i} className="shimmer h-28 rounded-card" />)}</div>
        <div className="shimmer h-64 rounded-card" />
      </div>
    )
  }

  if (!startup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <Card className="p-10 max-w-md w-full">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.25)]">
            <Zap className="h-6 w-6 text-blue-bright" />
          </div>
          <h1 className="text-[24px] font-black tracking-tight text-cream">Complete your profile</h1>
          <p className="mt-2 text-[14px] text-cream-muted">Finish onboarding to appear in the investor feed.</p>
          <Link href="/onboarding" className="mt-6 block">
            <Button fullWidth>Continue onboarding <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
        </Card>
      </div>
    )
  }

  const status = (startup.status ?? 'pending_review') as StartupStatus
  const memberSince = user?.created_at ? formatDate(user.created_at) : null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-16 sm:px-6">

      {/* ── Rejection / Changes banner ─────────────── */}
      {(status === 'rejected' || status === 'changes_requested') && (
        <div className={`mb-5 flex flex-col gap-3 rounded-card border p-5 sm:flex-row sm:items-start sm:justify-between ${
          status === 'rejected'
            ? 'border-[rgba(255,69,58,0.25)] bg-[rgba(255,69,58,0.06)]'
            : 'border-[rgba(75,124,246,0.25)] bg-[rgba(75,124,246,0.06)]'
        }`}>
          <div className="flex gap-3">
            <AlertCircle className={`h-5 w-5 mt-0.5 shrink-0 ${status === 'rejected' ? 'text-[#FF453A]' : 'text-blue-bright'}`} />
            <div>
              <p className="text-[14px] font-bold text-cream">
                {status === 'rejected' ? 'Your listing was not approved' : 'Changes have been requested'}
              </p>
              {startup.rejection_reason && (
                <p className="mt-1 text-[13px] text-cream-muted">
                  <strong className="text-cream">Reason:</strong> {startup.rejection_reason}
                </p>
              )}
            </div>
          </div>
          <Link href="/profile/edit" className="shrink-0">
            <Button size="sm">
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Edit &amp; resubmit
            </Button>
          </Link>
        </div>
      )}

      {/* ── Profile header ─────────────────────────── */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[rgba(75,124,246,0.06)] via-transparent to-[rgba(240,230,208,0.03)] pointer-events-none" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <AvatarDisplay avatarUrl={user?.avatar_url ?? null} name={user?.full_name ?? null} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[26px] font-black tracking-tight text-cream leading-none">{user?.full_name ?? 'Founder'}</h1>
                <Badge variant="blue">Founder</Badge>
                <StatusBadge status={status} />
              </div>
              <p className="mt-1 text-[14px] text-cream-muted">{user?.email}</p>
              {memberSince && (
                <div className="mt-2 flex items-center gap-1.5 text-[12px] text-cream-subtle">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Member since {memberSince}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:shrink-0">
            <Link href="/settings"><Button variant="secondary" size="sm"><Edit3 className="mr-1.5 h-3.5 w-3.5" />Edit profile</Button></Link>
            <Link href="/interests"><Button size="sm">View interests{matches.length > 0 && <span className="ml-2 flex h-4 w-4 items-center justify-center rounded-full bg-navy text-[10px] font-black">{matches.length}</span>}</Button></Link>
          </div>
        </div>
      </Card>

      {/* ── Stats ──────────────────────────────────── */}
      <div className="mt-5 grid gap-4 sm:grid-cols-4">
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Profile views</p>
              <p className="mt-2 text-[36px] font-black tracking-tightest text-cream leading-none">{startup.view_count ?? 0}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.20)]">
              <Eye className="h-4 w-4 text-blue-bright" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Saved by</p>
              <p className="mt-2 text-[36px] font-black tracking-tightest text-cream leading-none">{saveCount}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(232,165,60,0.12)] border border-[rgba(232,165,60,0.20)]">
              <Bookmark className="h-4 w-4 text-amber" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Pending</p>
              <p className="mt-2 text-[36px] font-black tracking-tightest text-cream leading-none">{matches.length}</p>
              <Link href="/interests" className="mt-1.5 flex items-center gap-1 text-[12px] text-blue-bright hover:underline">Inbox <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(52,199,89,0.10)] border border-[rgba(52,199,89,0.20)]">
              <TrendingUp className="h-4 w-4 text-[#30D158]" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Matches</p>
              <p className="mt-2 text-[36px] font-black tracking-tightest text-cream leading-none">{acceptedMatches}</p>
              <Link href="/chat" className="mt-1.5 flex items-center gap-1 text-[12px] text-blue-bright hover:underline">Open chats <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.20)]">
              <CheckCircle2 className="h-4 w-4 text-blue-bright" />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Active listing ─────────────────────────── */}
      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-black tracking-tight text-cream">Your listing</h2>
          <Link href="/profile/edit"><Button variant="ghost" size="sm"><Edit3 className="mr-1.5 h-3.5 w-3.5" />Edit startup</Button></Link>
        </div>
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-[rgba(75,124,246,0.14)] border border-[rgba(75,124,246,0.25)] text-blue-bright font-black text-[22px]">
                {startup.name[0]}
              </div>
              <div>
                <h3 className="text-[20px] font-black tracking-tight text-cream">{startup.name}</h3>
                {startup.tagline && <p className="mt-1 text-[14px] text-cream-muted max-w-lg">{startup.tagline}</p>}
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
                  {startup.sector.map((s) => <Badge key={s} variant="muted">{s}</Badge>)}
                </div>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          {(startup.problem || startup.solution || startup.traction) && (
            <div className="mt-6 grid gap-5 border-t border-[rgba(240,230,208,0.06)] pt-6 sm:grid-cols-2">
              {startup.problem   && <div><p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Problem</p><p className="text-[13px] leading-relaxed text-cream-muted">{startup.problem}</p></div>}
              {startup.solution  && <div><p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Solution</p><p className="text-[13px] leading-relaxed text-cream-muted">{startup.solution}</p></div>}
              {startup.traction  && <div className="sm:col-span-2"><p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Traction</p><p className="text-[13px] leading-relaxed text-cream-muted">{startup.traction}</p></div>}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(240,230,208,0.06)] pt-5">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-amber" />
              <span className="text-[15px] font-bold text-amber">Raising {formatRaise(startup.raise_amount)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {startup.website_url && <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] text-cream-muted hover:text-cream transition-colors"><Globe className="h-3.5 w-3.5" />Website<ExternalLink className="h-3 w-3" /></a>}
              {startup.pitch_deck_url && <a href={startup.pitch_deck_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] text-blue-bright hover:text-cream transition-colors"><FileText className="h-3.5 w-3.5" />Pitch deck<ExternalLink className="h-3 w-3" /></a>}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Recent activity ────────────────────────── */}
      <div className="mt-6">
        <h2 className="mb-4 text-[18px] font-black tracking-tight text-cream">Recent interest</h2>
        <Card>
          {matches.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-[14px] text-cream-muted">No investor interest yet — your listing is {status === 'active' ? 'live' : 'pending review'}.</p>
              <Link href="/explore" className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-blue-bright hover:underline">Explore other startups <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          ) : (
            <ul className="divide-y divide-[rgba(240,230,208,0.06)]">
              {matches.slice(0, 6).map((m) => (
                <li key={m.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(52,199,89,0.10)] border border-[rgba(52,199,89,0.20)] text-[11px] font-black text-[#30D158]">
                      {(m.investors?.users?.full_name ?? 'I')[0].toUpperCase()}
                    </div>
                    <p className="text-[13px] font-semibold text-cream">
                      {m.investors?.users?.full_name ?? 'An investor'}{' '}
                      <span className="font-normal text-cream-muted">expressed interest</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] text-cream-subtle">{formatDate(m.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Explore CTA ───────────────────────────── */}
      <Card className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row" padding="md">
        <div>
          <p className="text-[15px] font-bold text-cream">See what other founders are building</p>
          <p className="mt-0.5 text-[13px] text-cream-muted">Browse the marketplace to see your competition and find inspiration.</p>
        </div>
        <Link href="/explore" className="shrink-0">
          <Button variant="secondary" size="sm">Explore startups <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
        </Link>
      </Card>
    </div>
  )
}
