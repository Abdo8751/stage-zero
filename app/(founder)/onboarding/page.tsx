'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/auth'
import { useUser } from '@/hooks/useUser'
import {
  SECTORS,
  STARTUP_STAGES,
  type Sector,
  type StartupStage,
} from '@/lib/types'
import { validateRequired } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'

interface Step1Data {
  full_name: string
  bio: string
  avatar_url: string | null
}

interface Step2Data {
  name: string
  tagline: string
  sector: Sector[]
  stage: StartupStage
  problem: string
  solution: string
}

interface Step3Data {
  raise_amount: string
  fund_usage: string
  website_url: string
  traction: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const { user, startup, loading: userLoading, refresh } = useUser()
  const { showToast } = useToast()

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [step1, setStep1] = useState<Step1Data>({ full_name: '', bio: '', avatar_url: null })
  const [step2, setStep2] = useState<Step2Data>({
    name: '',
    tagline: '',
    sector: [],
    stage: 'pre_seed',
    problem: '',
    solution: '',
  })
  const [step3, setStep3] = useState<Step3Data>({
    raise_amount: '',
    fund_usage: '',
    website_url: '',
    traction: '',
  })
  const [avatarFile, setAvatarFile] = useState<File | null>(null)

  useEffect(() => {
    if (startup) {
      router.push('/dashboard')
    }
  }, [startup, router])

  useEffect(() => {
    if (user?.full_name) {
      setStep1((s) => ({ ...s, full_name: user.full_name ?? '' }))
    }
  }, [user])

  const toggleSector = (sector: Sector) => {
    setStep2((s) => ({
      ...s,
      sector: s.sector.includes(sector)
        ? s.sector.filter((x) => x !== sector)
        : [...s.sector, sector],
    }))
  }

  const saveStep1 = async () => {
    const errs: Record<string, string> = {}
    const nameErr = validateRequired(step1.full_name, 'Full name')
    if (nameErr) errs.full_name = nameErr
    setErrors(errs)
    if (Object.keys(errs).length > 0 || !user) return

    setSaving(true)
    try {
      const supabase = createClient()
      let avatarUrl = step1.avatar_url

      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile)
      }

      const { error } = await supabase
        .from('users')
        .update({ full_name: step1.full_name.trim(), avatar_url: avatarUrl })
        .eq('id', user.id)

      if (error) throw error
      showToast('Profile saved', 'success')
      setStep(2)
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const saveStep2 = async () => {
    const errs: Record<string, string> = {}
    if (validateRequired(step2.name, 'Startup name')) errs.name = 'Startup name is required'
    if (step2.sector.length === 0) errs.sector = 'Select at least one sector'
    if (validateRequired(step2.problem, 'Problem')) errs.problem = 'Problem is required'
    if (validateRequired(step2.solution, 'Solution')) errs.solution = 'Solution is required'
    setErrors(errs)
    if (Object.keys(errs).length > 0 || !user) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: existing, error: fetchError } = await supabase
        .from('startups')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (fetchError) throw fetchError

      const payload = {
        user_id: user.id,
        name: step2.name.trim(),
        tagline: step2.tagline.trim() || null,
        sector: step2.sector,
        stage: step2.stage,
        problem: step2.problem.trim(),
        solution: step2.solution.trim(),
        is_active: true,
      }

      const { error } = existing
        ? await supabase.from('startups').update(payload).eq('id', existing.id)
        : await supabase.from('startups').insert(payload)

      if (error) throw error
      showToast('Startup details saved', 'success')
      setStep(3)
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const completeOnboarding = async () => {
    const errs: Record<string, string> = {}
    if (validateRequired(step3.raise_amount, 'Raise amount')) errs.raise_amount = 'Required'
    if (validateRequired(step3.fund_usage, 'Fund usage')) errs.fund_usage = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length > 0 || !user) return

    setSaving(true)
    try {
      const supabase = createClient()
      const tractionText = `Fund usage: ${step3.fund_usage.trim()}\n\nTraction: ${step3.traction.trim()}`

      const { error } = await supabase
        .from('startups')
        .update({
          raise_amount: parseInt(step3.raise_amount.replace(/\D/g, ''), 10) || null,
          website_url: step3.website_url.trim() || null,
          traction: tractionText,
          is_active: true,
        })
        .eq('user_id', user.id)

      if (error) throw error
      showToast('Onboarding complete!', 'success')
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (userLoading) {
    return <div className="py-16 text-center text-muted">Loading…</div>
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">Founder onboarding</h1>
      <p className="mt-2 text-muted">Step {step} of 3</p>

      <div className="mt-4 h-2 w-full bg-muted/20">
        <div
          className="h-full bg-gold transition-all"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      <Card className="mt-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl">About you</h2>
            <Input
              label="Full name"
              value={step1.full_name}
              onChange={(e) => setStep1({ ...step1, full_name: e.target.value })}
              error={errors.full_name}
            />
            <Textarea
              label="Short bio"
              value={step1.bio}
              onChange={(e) => setStep1({ ...step1, bio: e.target.value })}
              placeholder="Tell investors about yourself…"
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-navy">Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm"
              />
            </div>
            <Button onClick={saveStep1} disabled={saving} fullWidth>
              {saving ? 'Saving…' : 'Continue'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl">Your startup</h2>
            <Input
              label="Startup name"
              value={step2.name}
              onChange={(e) => setStep2({ ...step2, name: e.target.value })}
              error={errors.name}
            />
            <Input
              label="Tagline"
              value={step2.tagline}
              onChange={(e) => setStep2({ ...step2, tagline: e.target.value })}
            />
            <div>
              <p className="mb-2 text-sm font-medium text-navy">Sector</p>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSector(s)}
                    className={`rounded border px-3 py-1 text-xs ${
                      step2.sector.includes(s)
                        ? 'border-gold bg-gold/20 text-navy'
                        : 'border-muted/40 text-muted'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.sector && <p className="mt-1 text-sm text-red-600">{errors.sector}</p>}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-navy">Stage</label>
              <select
                value={step2.stage}
                onChange={(e) => setStep2({ ...step2, stage: e.target.value as StartupStage })}
                className="w-full border border-muted/40 bg-white/60 px-4 py-3"
              >
                {STARTUP_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <Textarea
              label="Problem"
              value={step2.problem}
              onChange={(e) => setStep2({ ...step2, problem: e.target.value })}
              error={errors.problem}
            />
            <Textarea
              label="Solution"
              value={step2.solution}
              onChange={(e) => setStep2({ ...step2, solution: e.target.value })}
              error={errors.solution}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={() => setStep(1)} fullWidth>
                Back
              </Button>
              <Button onClick={saveStep2} disabled={saving} fullWidth>
                {saving ? 'Saving…' : 'Continue'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl">Funding</h2>
            <Input
              label="Raise amount (EGP)"
              type="number"
              value={step3.raise_amount}
              onChange={(e) => setStep3({ ...step3, raise_amount: e.target.value })}
              error={errors.raise_amount}
            />
            <Textarea
              label="What will funds be used for?"
              value={step3.fund_usage}
              onChange={(e) => setStep3({ ...step3, fund_usage: e.target.value })}
              error={errors.fund_usage}
            />
            <Input
              label="Website URL"
              value={step3.website_url}
              onChange={(e) => setStep3({ ...step3, website_url: e.target.value })}
              placeholder="https://"
            />
            <Textarea
              label="Traction"
              value={step3.traction}
              onChange={(e) => setStep3({ ...step3, traction: e.target.value })}
              placeholder="Users, revenue, partnerships…"
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="secondary" onClick={() => setStep(2)} fullWidth>
                Back
              </Button>
              <Button onClick={completeOnboarding} disabled={saving} fullWidth>
                {saving ? 'Completing…' : 'Complete onboarding'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
