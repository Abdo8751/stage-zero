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

      // Increment view count
      await supabase.rpc('increment_startup_view', { startup_id: id })

      const { data, error: fetchError } = await supabase
        .from('startups')
        .select('*, users(full_name, avatar_url, email)')
        .eq('id', id)
        .maybeSingle()
      if (fetchError) throw fetchError
      setStartup(data as StartupDetail | null)

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

      const { data: match, error: matchError } = await supabase
        .from('matches')
        .insert({ startup_id: startup.id, investor_id: investor.id, status: 'pending' })
        .select('id')
        .single()
      if (matchError) throw matchError

      await supabase
        .from('investors')
        .update({ credits: investor.credits - 1 })
        .eq('id', investor.id)

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

      setInterest('pending')
      setMatchId(match.id)
      showToast('Interest sent! The founder will review your request.', 'success')
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

  const isVerified = user?.is_verified && investor?.verification_status === 'approved'

  if (id.startsWith('pick-')) {
    return (
      <div className="mx-auto max-w-lg px-4 pt-24 pb-12 text-center">
        <Card>
          <h1 className="text-[22px] font-black tracking-tight text-cream">Stage Zero Pick</h1>
          <p className="mt-3 text-[14px] text-cream-muted">This is a curated preview. Browse live listings below.</p>
          <Button className="mt-6" onClick={() => router.push('/browse')}>View all startups</Button>
        </Card>
      </div>
    )
  }

  if (loading) return <div className="mx-auto max-w-3xl px-4 pt-24 space-y-4"><div className="shimmer h-48 rounded-card" /><div className="shimmer h-64 rounded-card" /></div>
  if (error || !startup) return <div className="pt-24 text-center text-[#FF453A]">{error ?? 'Startup not found'}</div>

  const interestButton = {
    idle:     { label: "I'm interested (1 credit)", disabled: !isVerified || expressing },
    pending:  { label: 'Interest sent — awaiting response', disabled: true },
    accepted: { label: 'Connected ✓', disabled: true },
    declined: { label: 'Not available', disabled: true },
  }[interest]

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-20 pb-16 sm:px-6">
      <button onClick={() => router.back()} className="mb-6 flex items-center gap-1.5 text-[13px] text-cream-muted hover:text-cream transition-colors cursor-pointer">
        <ArrowLeft className="h-3.5 w-3.5" /> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(75,124,246,0.14)] border border-[rgba(75,124,246,0.25)] text-blue-bright font-black text-[24px]">
            {startup.name[0]}
          </div>
          <div>
            <h1 className="text-[28px] font-black tracking-tight text-cream">{startup.name}</h1>
            {startup.tagline && <p className="mt-1 text-[15px] text-cream-muted">{startup.tagline}</p>}
            <div className="mt-2.5 flex flex-wrap gap-2">
              <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
              {startup.sector.map((s) => <Badge key={s} variant="muted">{s}</Badge>)}
            </div>
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="mt-6 flex flex-wrap gap-4 border-y border-[rgba(240,230,208,0.06)] py-4">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-4 w-4 text-amber" />
          <span className="text-[14px] font-bold text-amber">Raising {formatRaise(startup.raise_amount)}</span>
        </div>
        {startup.website_url && (
          <a href={startup.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[13px] text-cream-muted hover:text-cream transition-colors">
            <Globe className="h-3.5 w-3.5" /> Website <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Details */}
      <div className="mt-6 space-y-6">
        {startup.problem && (
          <Card padding="md">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Problem</p>
            <p className="text-[14px] leading-relaxed text-cream-muted">{startup.problem}</p>
          </Card>
        )}
        {startup.solution && (
          <Card padding="md">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Solution</p>
            <p className="text-[14px] leading-relaxed text-cream-muted">{startup.solution}</p>
          </Card>
        )}
        {startup.traction && (
          <Card padding="md">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Traction &amp; funding</p>
            <p className="text-[14px] leading-relaxed text-cream-muted whitespace-pre-wrap">{startup.traction}</p>
          </Card>
        )}

        {/* Pitch deck — verified investors only */}
        {isVerified && startup.pitch_deck_url && (
          <Card padding="md">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Pitch deck</p>
            <a href={startup.pitch_deck_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[14px] text-blue-bright hover:underline">
              <FileText className="h-4 w-4" /> View pitch deck (PDF) <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Card>
        )}

        {/* Founder info — verified investors only */}
        {isVerified && (
          <Card padding="md">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Founder</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-[#F5EDDB] to-[#D5C8A8] text-[13px] font-black text-navy">
                {startup.users?.full_name?.[0] ?? '?'}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-cream">{startup.users?.full_name ?? 'Founder'}</p>
                <p className="text-[13px] text-cream-muted">{startup.users?.email}</p>
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
          className={interest === 'accepted' ? 'bg-[rgba(52,199,89,0.15)] text-[#30D158] border border-[rgba(52,199,89,0.25)]' : ''}
        >
          {expressing ? 'Sending…' : interestButton.label}
        </Button>
        <Button
          variant="secondary"
          onClick={handleSave}
          fullWidth
          className="inline-flex items-center gap-1.5 justify-center"
        >
          <Bookmark className={`h-4 w-4 ${saved ? 'fill-cream text-cream' : ''}`} />
          {saved ? 'Saved' : 'Save to list'}
        </Button>
      </div>

      {interest === 'idle' && !isVerified && (
        <p className="mt-3 text-center text-[13px] text-cream-subtle">Complete verification to express interest.</p>
      )}
      {interest === 'idle' && isVerified && investor && investor.credits === 0 && (
        <p className="mt-3 text-center text-[13px] text-[#FF453A]">No credits remaining. <button onClick={() => router.push('/upgrade')} className="underline cursor-pointer">Upgrade to get more.</button></p>
      )}
      {interest === 'idle' && isVerified && investor && investor.credits > 0 && (
        <p className="mt-3 text-center text-[13px] text-cream-subtle">You have {investor.credits} credit{investor.credits !== 1 ? 's' : ''} remaining.</p>
      )}

      {interest === 'accepted' && matchId && (
        <Button variant="secondary" fullWidth className="mt-3" onClick={() => router.push(`/chat/${matchId}`)}>
          Open chat <ArrowLeft className="ml-1.5 h-3.5 w-3.5 rotate-180" />
        </Button>
      )}
    </div>
  )
}
