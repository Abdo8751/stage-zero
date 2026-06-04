'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { uploadPitchDeck } from '@/lib/auth'
import { useUser } from '@/hooks/useUser'
import { SECTORS, STARTUP_STAGES, type Sector, type StartupStage } from '@/lib/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { ArrowLeft } from 'lucide-react'

export default function EditProfilePage() {
  const router = useRouter()
  const { user, startup, loading, refresh } = useUser()
  const { showToast } = useToast()
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [tagline, setTagline] = useState('')
  const [sector, setSector] = useState<Sector[]>([])
  const [stage, setStage] = useState<StartupStage>('pre_seed')
  const [problem, setProblem] = useState('')
  const [solution, setSolution] = useState('')
  const [raiseAmount, setRaiseAmount] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [traction, setTraction] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [pitchFile, setPitchFile] = useState<File | null>(null)

  useEffect(() => {
    if (startup) {
      setName(startup.name)
      setTagline(startup.tagline ?? '')
      setSector((startup.sector ?? []) as Sector[])
      setStage(startup.stage)
      setProblem(startup.problem ?? '')
      setSolution(startup.solution ?? '')
      setRaiseAmount(startup.raise_amount?.toString() ?? '')
      setWebsiteUrl(startup.website_url ?? '')
      setTraction(startup.traction ?? '')
      setIsActive(startup.is_active)
    }
  }, [startup])

  const toggleSector = (s: Sector) => {
    setSector((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !startup) return

    setSaving(true)
    try {
      const supabase = createClient()
      let pitchDeckUrl = startup.pitch_deck_url

      if (pitchFile) {
        const uploaded = await uploadPitchDeck(user.id, pitchFile)
        if (uploaded) pitchDeckUrl = uploaded
      }

      // If rejected or changes_requested, resubmit resets status to pending_review
      const wasRejected =
        startup.status === 'rejected' || startup.status === 'changes_requested'

      const { error } = await supabase
        .from('startups')
        .update({
          name: name.trim(),
          tagline: tagline.trim() || null,
          sector,
          stage,
          problem: problem.trim(),
          solution: solution.trim(),
          raise_amount: parseInt(raiseAmount.replace(/\D/g, ''), 10) || null,
          website_url: websiteUrl.trim() || null,
          traction: traction.trim() || null,
          pitch_deck_url: pitchDeckUrl,
          is_active: isActive,
          ...(wasRejected ? { status: 'pending_review', rejection_reason: null } : {}),
        })
        .eq('id', startup.id)

      if (error) throw error
      showToast('Profile updated', 'success')
      await refresh()
      router.push('/dashboard')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-16 text-center text-text-secondary font-body">Loading...</div>

  if (!startup) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-text-secondary font-body">Complete onboarding first.</p>
        <button
          type="button"
          onClick={() => router.push('/onboarding')}
          className="mt-4 flex items-center gap-1.5 mx-auto text-[13px] text-blue-bright hover:underline"
        >
          Go to onboarding <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => router.push('/dashboard')}
        className="mb-5 flex items-center gap-1.5 text-[13px] text-cream-muted hover:text-cream transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to dashboard
      </button>
      <h1 className="text-3xl sm:text-4xl text-text-primary">Edit profile</h1>

      <Card className="mt-8">
        <form onSubmit={handleSave} className="space-y-6">
          <Input label="Startup name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <div>
            <p className="mb-2.5 text-xs font-normal font-body text-[rgba(255,255,255,0.6)]">Sector</p>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSector(s)}
                  className={`rounded-[8px] border px-3 py-1.5 text-xs transition-all font-body ${
                    sector.includes(s)
                      ? 'border-gold bg-gold/20 text-gold shadow-[0_0_8px_rgba(201,168,76,0.2)]'
                      : 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-normal font-body text-[rgba(255,255,255,0.6)]">Stage</label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as StartupStage)}
              className="w-full bg-[rgba(255,255,255,0.06)] backdrop-blur-[10px] border border-[rgba(255,255,255,0.12)] rounded-[8px] px-4 py-3 font-body font-light text-sm text-[rgba(255,255,255,0.9)] placeholder:text-[rgba(255,255,255,0.35)] focus:border-[rgba(201,168,76,0.6)] focus:ring-[3px] focus:ring-[rgba(201,168,76,0.1)] focus:outline-none transition-all [&>option]:bg-[#0a0f1a] [&>option]:text-white"
            >
              {STARTUP_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <Textarea label="Problem" value={problem} onChange={(e) => setProblem(e.target.value)} />
          <Textarea label="Solution" value={solution} onChange={(e) => setSolution(e.target.value)} />
          <Input
            label="Raise amount (EGP)"
            type="number"
            value={raiseAmount}
            onChange={(e) => setRaiseAmount(e.target.value)}
          />
          <Input label="Website" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
          <Textarea label="Traction" value={traction} onChange={(e) => setTraction(e.target.value)} />
          <div>
            <label className="mb-1.5 block text-xs font-normal font-body text-[rgba(255,255,255,0.6)]">Pitch deck (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPitchFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-text-secondary font-body file:mr-4 file:py-2 file:px-4 file:rounded-[8px] file:border-0 file:text-xs file:font-semibold file:bg-[rgba(255,255,255,0.08)] file:text-text-primary file:hover:bg-[rgba(255,255,255,0.12)] file:cursor-pointer"
            />
            {startup.pitch_deck_url && (
              <p className="mt-1.5 text-xs text-gold font-body">Current deck uploaded</p>
            )}
          </div>
          <label className="flex items-center gap-3 text-sm text-text-secondary font-body cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-gold rounded border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)]"
            />
            Listing active (uncheck to pause)
          </label>
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving...' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
