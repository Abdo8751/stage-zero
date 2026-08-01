'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { notify } from '@/lib/notify'
import { useUser } from '@/hooks/useUser'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Startup, StartupStage, User } from '@/lib/types'
import { STARTUP_STAGES } from '@/lib/types'
import { useToast } from '@/components/ui/Toast'
import {
  TrendingUp, Globe, FileText, ExternalLink,
  Bookmark, CheckCircle2, Clock, XCircle, ArrowLeft,
  Users, UserPlus,
} from 'lucide-react'

interface StartupDetail extends Startup {
  users: Pick<User, 'full_name' | 'avatar_url' | 'email'> | null
}

type InterestState = 'idle' | 'pending' | 'accepted' | 'declined'

function stageLabel(stage: StartupStage) {
  return STARTUP_STAGES.find((s) => s.value === stage)?.label ?? stage
}

function formatRaise(amount: number | null) {
  if (!amount) return 'Undisclosed'
  if (amount >= 1_000_000) return `EGP ${(amount / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
  return `EGP ${(amount / 1_000).toFixed(0)}K`
}

// Renders the free-text traction field, bolding any line that starts with a
// "Traction:" or "Fund usage:" / "Funding:" label so they read as sub-headings.
function renderTraction(text: string) {
  return text.split('\n').map((line, i) => {
    const m = line.match(/^(traction|fund usage|funding)\b\s*:?/i)
    if (m) {
      const label = m[0]
      const rest = line.slice(label.length)
      return (
        <p key={i} className="whitespace-pre-wrap text-[15px] leading-7 text-ink/65">
          <span className="font-semibold text-ink">{label}</span>
          {rest}
        </p>
      )
    }
    return (
      <p key={i} className="whitespace-pre-wrap text-[15px] leading-7 text-ink/65">
        {line}
      </p>
    )
  })
}

export default function StartupProfilePage() {
  const params   = useParams()
  const router   = useRouter()
  const id       = params.id as string
  const { user, investor } = useUser()
  const { showToast } = useToast()

  const [startup,     setStartup]     = useState<StartupDetail | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)
  const [saved,       setSaved]       = useState(false)
  const [interest,    setInterest]    = useState<InterestState>('idle')
  const [expressing,  setExpressing]  = useState(false)
  const [matchId,     setMatchId]     = useState<string | null>(null)

  const fetchStartup = useCallback(async () => {
    if (id.startsWith('pick-')) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Please sign in again')

      void fetch(`/api/startups/${id}/view`, { method: 'POST' }).catch(() => null)

      const detailRes = await fetch(`/api/startups/${id}/detail`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      const detailJson = (await detailRes.json()) as { startup?: StartupDetail; error?: string }
      if (!detailRes.ok || detailJson.error) throw new Error(detailJson.error ?? 'Failed to load startup')
      setStartup(detailJson.startup ?? null)

      // Check existing interest
      if (investor) {
        const { data: match } = await supabase
          .from('matches')
          .select('id, status')
          .eq('startup_id', id)
          .eq('investor_id', investor.id)
          .maybeSingle()
        if (match) {
          setInterest(match.status as InterestState)
          setMatchId(match.id)
        }

        // Check saved
        const { data: saved } = await supabase
          .from('saved_startups')
          .select('id')
          .eq('investor_id', investor.id)
          .eq('startup_id', id)
          .maybeSingle()
        setSaved(!!saved)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load startup')
    } finally {
      setLoading(false)
    }
  }, [id, investor])

  useEffect(() => { void fetchStartup() }, [fetchStartup])

  const handleInterest = async () => {
    if (!investor || !startup) return

    if (investor.credits < 1) {
      showToast('No credits remaining. Upgrade to continue.', 'error')
      router.push('/upgrade')
      return
    }

    if (interest !== 'idle') return

    setExpressing(true)
    try {
      const supabase = createClient()
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) throw sessionError
      const token = sessionData.session?.access_token
      if (!token) throw new Error('Please sign in again')

      const interestRes = await fetch('/api/matches/express-interest', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ startupId: startup.id }),
      })
      const interestJson = (await interestRes.json()) as {
        matchId?: string
        alreadyExists?: boolean
        error?: string
      }
      if (!interestRes.ok || interestJson.error || !interestJson.matchId) {
        throw new Error(interestJson.error ?? 'Failed to express interest')
      }

      if (!interestJson.alreadyExists) {
        // Notify founder
        const founderUserId = startup.user_id
        const investorWithUser = investor as typeof investor & { users?: { full_name: string | null } | null }
        await notify(
          founderUserId,
          'new_interest',
          `${investorWithUser.users?.full_name ?? 'An investor'} expressed interest in ${startup.name}`,
          '/interests',
          'sendNewInterest',
          {
            to: startup.users?.email ?? '',
            founderName: startup.users?.full_name ?? 'Founder',
            investorName: investorWithUser.users?.full_name ?? 'An investor',
            startupName: startup.name,
          },
        )
      }

      setInterest('pending')
      setMatchId(interestJson.matchId)
      showToast(
        interestJson.alreadyExists ? 'Interest already sent.' : 'Interest sent! The founder will review your request.',
        'success',
      )
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to express interest', 'error')
    } finally {
      setExpressing(false)
    }
  }

  const handleSave = async () => {
    if (!investor) return
    const supabase = createClient()
    if (saved) {
      await supabase.from('saved_startups').delete().eq('investor_id', investor.id).eq('startup_id', id)
      setSaved(false)
    } else {
      await supabase.from('saved_startups').insert({ investor_id: investor.id, startup_id: id })
      setSaved(true)
    }
  }

  const isVerified = investor?.verification_status === 'approved'
  const isFounderOwner = user?.role === 'founder' && Boolean(user?.is_verified) && startup?.user_id === user.id
  const canSeePrivate = isVerified || isFounderOwner

  if (id.startsWith('pick-')) {
    return (
      <div className="relative mx-auto max-w-lg px-4 pb-12 pt-32 text-center">
        <Card>
          <h1 className="font-serif text-[34px] font-semibold tracking-[-.04em] text-ink">Stage Zero Pick</h1>
          <p className="mt-3 text-[14px] font-normal text-ink/60">This is a curated preview. Browse live listings below.</p>
          <Button className="mt-6" onClick={() => router.push('/browse')}>View all startups</Button>
        </Card>
      </div>
    )
  }

  if (loading) return <div className="mx-auto max-w-3xl space-y-4 px-4 pt-32"><div className="shimmer h-48 rounded-card" /><div className="shimmer h-64 rounded-card" /></div>
  if (error || !startup) return <div className="pt-32 text-center text-red-700">{error ?? 'Startup not found'}</div>

  const interestButton = {
    idle:     { label: "I'm interested (1 credit)", disabled: !isVerified || expressing },
    pending:  { label: 'Interest sent — awaiting response', disabled: true },
    accepted: { label: 'Connected ✓', disabled: true },
    declined: { label: 'Not available', disabled: true },
  }[interest]

  return (
    <div className="relative mx-auto w-full max-w-4xl px-4 pb-16 pt-28 sm:px-6">
      <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />
      <button onClick={() => router.back()} className="mb-6 flex cursor-pointer items-center gap-1.5 text-[13px] text-ink/60 transition-colors hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Header */}
      <div className="glass-light flex items-start justify-between gap-4 rounded-[28px] p-6 sm:p-9">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-blue-accent/25 bg-blue-accent/10 text-[24px] font-semibold text-blue-accent">
            {startup.name[0]}
          </div>
          <div>
            <h1 className="font-serif text-[42px] font-semibold leading-none tracking-[-.04em] text-ink">{startup.name}</h1>
            {startup.tagline && <p className="mt-3 text-[15px] font-normal text-ink/60">{startup.tagline}</p>}
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
              {startup.sector.map((s) => <Badge key={s} variant="muted">{s}</Badge>)}
            </div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-5 flex flex-wrap items-center gap-4 border-y border-ink/10 py-5">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-amber" />
          <span className="text-[14px] font-bold text-amber">Raising {formatRaise(startup.raise_amount)}</span>
        </div>
        {startup.website_url && (
          <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] text-ink/60 transition-colors hover:text-ink">
            <Globe className="h-3.5 w-3.5" /> Website <ExternalLink className="h-3 w-3" />
          </a>
        )}

        {/* Team composition — numerals lead, labels support */}
        <div className="flex w-full items-center justify-between rounded-2xl border border-ink/10 bg-warm-cream px-4 py-3 shadow-[0_3px_10px_rgba(8,10,20,.05)] sm:ml-auto sm:w-auto sm:justify-start sm:gap-5">
          <span className="flex items-baseline gap-1.5">
            <Users className="h-3.5 w-3.5 shrink-0 self-center text-ink/40" />
            <b className="font-mono text-[18px] font-bold leading-none text-ink">{startup.team_size}</b>
            <span className="text-[12px] text-ink/60">{startup.team_size === 1 ? 'person' : 'people'}</span>
          </span>
          <span className="h-5 w-px shrink-0 bg-ink/15" />
          <span className="flex items-baseline gap-1.5">
            <UserPlus className="h-3.5 w-3.5 shrink-0 self-center text-ink/40" />
            <b className="font-mono text-[18px] font-bold leading-none text-ink">{startup.cofounder_count}</b>
            <span className="text-[12px] text-ink/60">co-founder{startup.cofounder_count === 1 ? '' : 's'}</span>
          </span>
        </div>
      </div>

      {/* Details — one continuous block, sections split by hairlines */}
      <div className="mt-6 space-y-6">
        {(startup.problem || startup.solution || startup.traction) && (
          <Card padding="lg">
            <div className="divide-y divide-ink/10">
              {startup.problem && (
                <section className="py-7 first:pt-0 last:pb-0">
                  <h3 className="font-serif text-2xl font-semibold text-ink">Problem</h3>
                  <p className="mt-4 whitespace-pre-wrap text-[15px] font-normal leading-7 text-ink/65">{startup.problem}</p>
                </section>
              )}
              {startup.solution && (
                <section className="py-7 first:pt-0 last:pb-0">
                  <h3 className="font-serif text-2xl font-semibold text-ink">Solution</h3>
                  <p className="mt-4 whitespace-pre-wrap text-[15px] font-normal leading-7 text-ink/65">{startup.solution}</p>
                </section>
              )}
              {startup.traction && (
                <section className="py-7 first:pt-0 last:pb-0">
                  <h3 className="font-serif text-2xl font-semibold text-ink">Traction &amp; funding</h3>
                  <div className="mt-4 space-y-2">{renderTraction(startup.traction)}</div>
                </section>
              )}
            </div>
          </Card>
        )}

        {/* Pitch deck — verified investors & owner founders only */}
        {canSeePrivate && startup.pitch_deck_url && (
          <Card padding="md">
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-blue-accent">Pitch deck</p>
            <a href={startup.pitch_deck_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[14px] font-semibold text-blue-accent hover:underline">
              <FileText className="h-4 w-4" /> View pitch deck (PDF) <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Card>
        )}

        {/* Founder info — verified investors & owner founders only */}
        {canSeePrivate && (
          <Card padding="md">
            <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-blue-accent">Founder</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-[#F5EDDB] to-[#D5C8A8] text-[13px] font-black text-navy">
                {startup.users?.full_name?.[0] ?? '?'}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-ink">{startup.users?.full_name ?? 'Founder'}</p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleInterest}
          disabled={interestButton.disabled}
          fullWidth
          className={interest === 'accepted' ? 'border border-blue-accent/25 bg-blue-accent/10 text-blue-accent' : ''}
        >
          {expressing ? 'Sending…' : interestButton.label}
        </Button>
        <Button
          variant="secondary"
          onClick={handleSave}
          fullWidth
          className="inline-flex items-center gap-1.5 justify-center"
        >
          <Bookmark className={`h-4 w-4 ${saved ? 'fill-blue-accent text-blue-accent' : ''}`} />
          {saved ? 'Saved' : 'Save to list'}
        </Button>
      </div>

      {interest === 'idle' && !isVerified && (
        <p className="mt-3 text-center text-[13px] text-ink/45">Complete verification to express interest.</p>
      )}
      {interest === 'idle' && isVerified && investor && investor.credits === 0 && (
        <p className="mt-3 text-center text-[13px] text-red-700">No credits remaining. <button onClick={() => router.push('/upgrade')} className="cursor-pointer underline">Upgrade to get more.</button></p>
      )}
      {interest === 'idle' && isVerified && investor && investor.credits > 0 && (
        <p className="mt-3 text-center text-[13px] text-ink/45">You have {investor.credits} credit{investor.credits !== 1 ? 's' : ''} remaining.</p>
      )}

      {interest === 'accepted' && matchId && (
        <Button variant="secondary" fullWidth className="mt-3" onClick={() => router.push(`/chat/${matchId}`)}>
          Open chat <ArrowLeft className="ml-1.5 h-3.5 w-3.5 rotate-180" />
        </Button>
      )}
    </div>
  )
}
