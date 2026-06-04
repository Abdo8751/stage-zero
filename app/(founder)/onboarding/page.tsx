'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/auth'
import { notify } from '@/lib/notify'
import { useUser } from '@/hooks/useUser'
import { SECTORS, STARTUP_STAGES, type Sector, type StartupStage } from '@/lib/types'
import { validateRequired } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle2, ArrowRight, Clock } from 'lucide-react'

const DRAFT_KEY = 'stage-zero-onboarding-draft'

interface Step1Data { full_name: string; bio: string }
interface Step2Data { name: string; tagline: string; sector: Sector[]; stage: StartupStage; problem: string; solution: string }
interface Step3Data { raise_amount: string; fund_usage: string; website_url: string; traction: string }
interface Draft { step: number; step1: Step1Data; step2: Step2Data; step3: Step3Data }

const defaultStep1: Step1Data = { full_name: '', bio: '' }
const defaultStep2: Step2Data = { name: '', tagline: '', sector: [], stage: 'pre_seed', problem: '', solution: '' }
const defaultStep3: Step3Data = { raise_amount: '', fund_usage: '', website_url: '', traction: '' }

function loadDraft(): Draft | null {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null') } catch { return null }
}
function saveDraft(d: Draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) } catch { /* ignore */ }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* ignore */ }
}

const STEPS = ['About you', 'Your startup', 'Funding']

export default function OnboardingPage() {
  const router = useRouter()
  const { user, startup, loading: userLoading, refresh } = useUser()
  const { showToast } = useToast()

  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step1, setStep1] = useState<Step1Data>(defaultStep1)
  const [step2, setStep2] = useState<Step2Data>(defaultStep2)
  const [step3, setStep3] = useState<Step3Data>(defaultStep3)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const initialCheckDone = useRef(false)

  // Resume from draft
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setStep(draft.step)
      setStep1(draft.step1)
      setStep2(draft.step2)
      setStep3(draft.step3)
    } else if (user?.full_name) {
      setStep1((s) => ({ ...s, full_name: user.full_name ?? '' }))
    }
  }, [user])

  // Redirect away from onboarding only on initial page load — not mid-flow after step 2 creates the startup
  useEffect(() => {
    if (userLoading) return
    if (initialCheckDone.current) return
    initialCheckDone.current = true
    if (startup) router.push('/dashboard')
  }, [userLoading, startup, router])

  const persistDraft = (overrides: Partial<Draft> = {}) => {
    saveDraft({ step, step1, step2, step3, ...overrides })
  }

  const toggleSector = (sector: Sector) => {
    setStep2((s) => ({
      ...s,
      sector: s.sector.includes(sector) ? s.sector.filter((x) => x !== sector) : [...s.sector, sector],
    }))
  }

  /* ── Step 1: profile ───────────────────────────────────── */
  const saveStep1 = async () => {
    const errs: Record<string, string> = {}
    if (validateRequired(step1.full_name, 'Full name')) errs.full_name = 'Full name is required'
    setErrors(errs)
    if (Object.keys(errs).length || !user) return

    setSaving(true)
    try {
      const supabase = createClient()
      let avatarUrl = user.avatar_url

      if (avatarFile) avatarUrl = await uploadAvatar(user.id, avatarFile)

      const { error } = await supabase
        .from('users')
        .update({ full_name: step1.full_name.trim(), avatar_url: avatarUrl })
        .eq('id', user.id)
      if (error) throw new Error(error.message)

      persistDraft({ step: 2 })
      setStep(2)
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Step 2: startup basics ────────────────────────────── */
  const saveStep2 = async () => {
    const errs: Record<string, string> = {}
    if (!step2.name.trim())             errs.name = 'Startup name is required'
    if (step2.sector.length === 0)      errs.sector = 'Select at least one sector'
    if (!step2.problem.trim())          errs.problem = 'Problem is required'
    if (!step2.solution.trim())         errs.solution = 'Solution is required'
    setErrors(errs)
    if (Object.keys(errs).length || !user) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { data: existing } = await supabase
        .from('startups').select('id').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()

      const payload = {
        user_id: user.id,
        name: step2.name.trim(),
        tagline: step2.tagline.trim() || null,
        sector: step2.sector,
        stage: step2.stage,
        problem: step2.problem.trim(),
        solution: step2.solution.trim(),
        is_active: false,            // not live until approved
        status: 'pending_review',
      }

      const { error } = existing
        ? await supabase.from('startups').update(payload).eq('id', existing.id)
        : await supabase.from('startups').insert(payload)
      if (error) throw new Error(error.message)

      persistDraft({ step: 3 })
      setStep(3)
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  /* ── Step 3: funding — completes onboarding ────────────── */
  const completeOnboarding = async () => {
    const errs: Record<string, string> = {}
    if (!step3.raise_amount.trim())  errs.raise_amount = 'Required'
    if (!step3.fund_usage.trim())    errs.fund_usage = 'Required'
    setErrors(errs)
    if (Object.keys(errs).length || !user) return

    setSaving(true)
    try {
      const supabase = createClient()
      const traction = [
        step3.fund_usage.trim() && `Fund usage: ${step3.fund_usage.trim()}`,
        step3.traction.trim()   && `Traction: ${step3.traction.trim()}`,
      ].filter(Boolean).join('\n\n')

      const { data: s, error: fetchErr } = await supabase
        .from('startups').select('id').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (fetchErr) throw new Error(fetchErr.message)

      const { error } = await supabase.from('startups').update({
        raise_amount: parseInt(step3.raise_amount.replace(/\D/g, ''), 10) || null,
        website_url:  step3.website_url.trim() || null,
        traction:     traction || null,
        status:       'pending_review',
        is_active:    false,
      }).eq('user_id', user.id)
      if (error) throw new Error(error.message)

      // DB notification for founder
      if (s) {
        await notify(
          user.id,
          'startup_approved',
          `Your startup "${step2.name}" has been submitted and is pending review.`,
          '/dashboard',
          'sendStartupSubmitted',
          { to: user.email, startupName: step2.name },
        )
      }

      // Notify admin (fire-and-forget)
      const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'admin@stagezero.eg'
      void fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id, type: 'admin', message: '',
          emailFn: 'sendAdminNewStartup',
          emailArgs: { to: adminEmail, founderName: user.full_name ?? user.email, startupName: step2.name },
        }),
      })

      clearDraft()
      await refresh()
      setDone(true)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pt-24 pb-12 flex flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(52,199,89,0.12)] border border-[rgba(52,199,89,0.25)]">
          <Clock className="h-7 w-7 text-[#30D158]" />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cream-muted">Submitted</p>
        <h1 className="mt-2 text-[28px] font-black tracking-tightest text-cream">Your startup is under review</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-cream-muted max-w-sm">
          We&apos;ll review your listing within 2–3 business days. You can track the status from your dashboard.
        </p>
        <Link href="/dashboard" className="mt-8">
          <Button>
            View your listing <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    )
  }

  if (userLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 pt-24 pb-12 space-y-4">
        <div className="shimmer h-8 w-48 rounded-[8px]" />
        <div className="shimmer h-2 w-full rounded-full" />
        <div className="shimmer h-80 rounded-card" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-20 pb-12">
      {/* Header */}
      <div className="mb-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cream-muted">Founder onboarding</p>
        <h1 className="mt-1 text-[30px] font-black tracking-tightest text-cream">
          {STEPS[step - 1]}
        </h1>
      </div>

      {/* Progress bar */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
              i + 1 < step ? 'bg-cream' : i + 1 === step ? 'bg-blue-bright' : 'bg-[rgba(240,230,208,0.10)]'
            }`} />
            <span className={`text-[10px] font-medium ${i + 1 === step ? 'text-blue-bright' : i + 1 < step ? 'text-cream-muted' : 'text-cream-subtle'}`}>
              {i + 1 < step ? <CheckCircle2 className="h-3 w-3" /> : `Step ${i + 1}`}
            </span>
          </div>
        ))}
      </div>

      <Card>
        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="space-y-5">
            <Input
              label="Full name"
              value={step1.full_name}
              onChange={(e) => setStep1({ ...step1, full_name: e.target.value })}
              error={errors.full_name}
              placeholder="Your full name"
            />
            <Textarea
              label="Short bio"
              value={step1.bio}
              onChange={(e) => setStep1({ ...step1, bio: e.target.value })}
              placeholder="Tell investors a little about yourself..."
            />
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">
                Profile photo (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                className="w-full text-[13px] text-cream-muted file:mr-4 file:py-2 file:px-4 file:rounded-btn file:border-0 file:text-[12px] file:font-semibold file:bg-[rgba(240,230,208,0.08)] file:text-cream file:cursor-pointer hover:file:bg-[rgba(240,230,208,0.14)]"
              />
            </div>
            <Button onClick={saveStep1} disabled={saving} fullWidth>
              {saving ? 'Saving…' : 'Continue'}
            </Button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="space-y-5">
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
              placeholder="One sentence that says it all"
            />
            <div>
              <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">Sector</p>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSector(s)}
                    className={`rounded-btn border px-3 py-1.5 text-[12px] font-medium transition-all cursor-pointer ${
                      step2.sector.includes(s)
                        ? 'border-blue-accent bg-[rgba(75,124,246,0.15)] text-blue-bright'
                        : 'border-glass-border bg-[rgba(255,255,255,0.04)] text-cream-muted hover:text-cream hover:border-[rgba(240,230,208,0.20)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.sector && <p className="mt-1.5 text-[12px] text-[#FF453A]">{errors.sector}</p>}
            </div>
            <div>
              <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">Stage</label>
              <select
                value={step2.stage}
                onChange={(e) => setStep2({ ...step2, stage: e.target.value as StartupStage })}
                className="w-full bg-[rgba(4,11,26,0.6)] border border-glass-border rounded-input px-4 py-3 text-[14px] text-cream focus:border-[rgba(75,124,246,0.5)] focus:outline-none transition-all [&>option]:bg-navy cursor-pointer"
              >
                {STARTUP_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <Textarea label="Problem" value={step2.problem} onChange={(e) => setStep2({ ...step2, problem: e.target.value })} error={errors.problem} placeholder="What problem are you solving?" />
            <Textarea label="Solution" value={step2.solution} onChange={(e) => setStep2({ ...step2, solution: e.target.value })} error={errors.solution} placeholder="How does your product solve it?" />
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => { persistDraft({ step: 1 }); setStep(1) }} fullWidth>Back</Button>
              <Button onClick={saveStep2} disabled={saving} fullWidth>{saving ? 'Saving…' : 'Continue'}</Button>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="space-y-5">
            <Input
              label="Raise amount (EGP)"
              type="number"
              value={step3.raise_amount}
              onChange={(e) => setStep3({ ...step3, raise_amount: e.target.value })}
              error={errors.raise_amount}
              placeholder="e.g. 2000000"
            />
            <Textarea
              label="What will funds be used for?"
              value={step3.fund_usage}
              onChange={(e) => setStep3({ ...step3, fund_usage: e.target.value })}
              error={errors.fund_usage}
              placeholder="Hiring, product development, marketing..."
            />
            <Input
              label="Website URL (optional)"
              value={step3.website_url}
              onChange={(e) => setStep3({ ...step3, website_url: e.target.value })}
              placeholder="https://"
            />
            <Textarea
              label="Traction (optional)"
              value={step3.traction}
              onChange={(e) => setStep3({ ...step3, traction: e.target.value })}
              placeholder="Users, revenue, partnerships, pilots..."
            />
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" onClick={() => { persistDraft({ step: 2 }); setStep(2) }} fullWidth>Back</Button>
              <Button onClick={completeOnboarding} disabled={saving} fullWidth>
                {saving ? 'Submitting…' : 'Submit for review'}
              </Button>
            </div>
            <p className="text-center text-[12px] text-cream-subtle">
              Your listing will be reviewed within 2–3 business days.
            </p>
          </div>
        )}
      </Card>
    </div>
  )
}
