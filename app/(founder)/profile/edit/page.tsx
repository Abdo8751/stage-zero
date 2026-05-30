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

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>

  if (!startup) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted">Complete onboarding first.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">Edit profile</h1>

      <Card className="mt-8">
        <form onSubmit={handleSave} className="space-y-5">
          <Input label="Startup name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} />
          <div>
            <p className="mb-2 text-sm font-medium text-navy">Sector</p>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSector(s)}
                  className={`rounded border px-3 py-1 text-xs ${
                    sector.includes(s) ? 'border-gold bg-gold/20' : 'border-muted/40'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as StartupStage)}
            className="w-full border border-muted/40 bg-white/60 px-4 py-3"
          >
            {STARTUP_STAGES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
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
            <label className="mb-2 block text-sm font-medium text-navy">Pitch deck (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPitchFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
            {startup.pitch_deck_url && (
              <p className="mt-1 text-xs text-muted">Current deck uploaded</p>
            )}
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-navy"
            />
            Listing active (uncheck to pause)
          </label>
          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
