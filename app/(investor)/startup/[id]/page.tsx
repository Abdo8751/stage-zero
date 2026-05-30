'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { addNotification, isStartupSaved, toggleSavedStartup } from '@/lib/auth'
import { useUser } from '@/hooks/useUser'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Startup, StartupStage, User } from '@/lib/types'
import { STARTUP_STAGES } from '@/lib/types'
import { useToast } from '@/components/ui/Toast'

interface StartupDetail extends Startup {
  users: Pick<User, 'full_name' | 'avatar_url' | 'email'> | null
}

function stageLabel(stage: StartupStage): string {
  return STARTUP_STAGES.find((s) => s.value === stage)?.label ?? stage
}

export default function StartupProfilePage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, investor } = useUser()
  const { showToast } = useToast()

  const [startup, setStartup] = useState<StartupDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [expressing, setExpressing] = useState(false)

  const fetchStartup = useCallback(async () => {
    if (id.startsWith('pick-')) {
      setStartup(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('startups')
        .select('*, users(full_name, avatar_url, email)')
        .eq('id', id)
        .maybeSingle()

      if (fetchError) throw fetchError
      setStartup(data as StartupDetail | null)
      setSaved(isStartupSaved(id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load startup')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void fetchStartup()
  }, [fetchStartup])

  const handleInterest = async () => {
    if (!investor || !startup) return

    if (investor.credits < 1) {
      showToast('No credits remaining. Upgrade to continue.', 'error')
      router.push('/upgrade')
      return
    }

    setExpressing(true)
    try {
      const supabase = createClient()

      const { data: existing, error: existError } = await supabase
        .from('matches')
        .select('id')
        .eq('startup_id', startup.id)
        .eq('investor_id', investor.id)
        .maybeSingle()

      if (existError) throw existError
      if (existing) {
        showToast('You already expressed interest in this startup', 'info')
        return
      }

      const { error: matchError } = await supabase.from('matches').insert({
        startup_id: startup.id,
        investor_id: investor.id,
        status: 'pending',
      })

      if (matchError) throw matchError

      const { error: creditError } = await supabase
        .from('investors')
        .update({ credits: investor.credits - 1 })
        .eq('id', investor.id)

      if (creditError) throw creditError

      addNotification({
        type: 'interest',
        title: 'Interest sent',
        body: `You expressed interest in ${startup.name}.`,
      })

      showToast('Interest sent! The founder will review your request.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to express interest', 'error')
    } finally {
      setExpressing(false)
    }
  }

  if (id.startsWith('pick-')) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <Card>
          <h1 className="text-2xl">Stage Zero Pick</h1>
          <p className="mt-4 text-muted">This is a curated preview. Browse live listings below.</p>
          <Button className="mt-6" onClick={() => router.push('/browse')}>
            View all startups
          </Button>
        </Card>
      </div>
    )
  }

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>
  if (error || !startup) {
    return <div className="py-16 text-center text-red-600">{error ?? 'Startup not found'}</div>
  }

  const verified = user?.is_verified && investor?.verification_status === 'approved'

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl">{startup.name}</h1>
          {startup.tagline && <p className="mt-2 text-lg text-muted">{startup.tagline}</p>}
        </div>
        <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
      </div>

      <Card className="mt-8">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-xl">
            {startup.users?.full_name?.[0] ?? '?'}
          </div>
          <div>
            <p className="font-medium">{startup.users?.full_name ?? 'Founder'}</p>
            <p className="text-sm text-muted">{startup.users?.email}</p>
          </div>
        </div>
      </Card>

      <div className="mt-6 flex flex-wrap gap-2">
        {startup.sector.map((s) => (
          <Badge key={s} variant="muted">
            {s}
          </Badge>
        ))}
      </div>

      <Card className="mt-6 space-y-6">
        {startup.problem && (
          <div>
            <h2 className="text-xl">Problem</h2>
            <p className="mt-2 text-muted">{startup.problem}</p>
          </div>
        )}
        {startup.solution && (
          <div>
            <h2 className="text-xl">Solution</h2>
            <p className="mt-2 text-muted">{startup.solution}</p>
          </div>
        )}
        {startup.traction && (
          <div>
            <h2 className="text-xl">Traction & funding</h2>
            <p className="mt-2 whitespace-pre-wrap text-muted">{startup.traction}</p>
          </div>
        )}
        {startup.raise_amount && (
          <p className="font-medium text-navy">
            Raising EGP {startup.raise_amount.toLocaleString()}
          </p>
        )}
        {verified && startup.pitch_deck_url && (
          <div>
            <h2 className="text-xl">Pitch deck</h2>
            <a
              href={startup.pitch_deck_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-gold hover:underline"
            >
              View pitch deck (PDF)
            </a>
          </div>
        )}
      </Card>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button
          onClick={handleInterest}
          disabled={expressing || !verified}
          fullWidth
        >
          {expressing ? 'Sending…' : "I'm interested (1 credit)"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setSaved(toggleSavedStartup(startup.id).includes(startup.id))}
          fullWidth
        >
          {saved ? '★ Saved' : '☆ Save to list'}
        </Button>
      </div>
      {!verified && (
        <p className="mt-3 text-sm text-muted">Complete verification to express interest.</p>
      )}
    </div>
  )
}
