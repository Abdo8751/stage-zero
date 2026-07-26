'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  clearPendingVerificationEmail,
  getNormalizedEmail,
  getPendingVerificationEmail,
  setPendingVerificationEmail,
} from '@/lib/auth'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { AuthShell } from '@/components/AuthShell'
import type { UserRole } from '@/lib/types'

function getFriendlyError(message: string) {
  if (/expired/i.test(message)) return 'That code has expired. Please request a new one.'
  if (/invalid|mismatch|incorrect/i.test(message)) return 'That code is invalid. Please check it and try again.'
  if (/too many|rate/i.test(message)) return 'Too many attempts. Please wait before trying again.'
  if (/network|fetch/i.test(message)) return 'Network error. Please try again.'
  return 'We could not verify that code. Please try again.'
}

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const roleParam = searchParams.get('role') as UserRole | null
  const emailParam = searchParams.get('email') ?? ''
  const inputRef = useRef<HTMLInputElement>(null)

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(60)

  useEffect(() => {
    const pending = getPendingVerificationEmail()
    const normalized = emailParam ? getNormalizedEmail(emailParam) : pending
    if (normalized) {
      setEmail(normalized)
      setPendingVerificationEmail(normalized)
    } else {
      setError('Missing verification email. Please start again.')
    }
  }, [emailParam])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const normalizedEmail = useMemo(() => getNormalizedEmail(email), [email])
  const canVerify = code.trim().length === 8 && !!normalizedEmail && !loading
  const canResend = !!normalizedEmail && !resendLoading && cooldown === 0

  const handleCodeChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    setCode(digits)
    setError(null)
    setMessage(null)
  }

  const finalizeProfile = async () => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) throw new Error('Verification completed but no session was created.')

    const response = await fetch('/api/auth/finalize-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ role: roleParam }),
    })
    const result = (await response.json()) as { error?: string; nextRoute?: string }
    if (!response.ok || !result.nextRoute) {
      throw new Error(result.error ?? 'Could not finish account setup.')
    }

    clearPendingVerificationEmail()
    router.replace(result.nextRoute)
  }

  const handleVerify = async () => {
    if (!canVerify) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: normalizedEmail,
        token: code,
        type: 'email',
      })

      if (verifyError) {
        throw verifyError
      }

      if (!data.session) {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) throw new Error('Verification completed but no session was created.')
      }

      clearPendingVerificationEmail()
      await finalizeProfile()
    } catch (err) {
      const friendly = getFriendlyError(err instanceof Error ? err.message : 'Verification failed')
      setError(friendly)
      showToast(friendly, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!canResend) return
    setResendLoading(true)
    setError(null)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: normalizedEmail,
      })

      if (resendError) throw resendError

      setCooldown(60)
      setMessage('We sent a new verification code.')
      showToast('Verification code resent.', 'success')
    } catch (err) {
      const friendly = getFriendlyError(err instanceof Error ? err.message : 'Resend failed')
      setError(friendly)
      showToast(friendly, 'error')
    } finally {
      setResendLoading(false)
    }
  }

  const handleChangeEmail = () => {
    clearPendingVerificationEmail()
    router.push('/signup')
  }

  return (
    <AuthShell kicker="Email verification">
        <h1 className="font-serif text-[38px] font-semibold tracking-[-.04em] text-ink">Verify your email</h1>
        <p className="mt-3 text-[15px] font-normal leading-6 text-ink/60">
          Enter the 8-digit code we sent to{' '}
          <span className="font-semibold text-ink">{normalizedEmail || 'your email address'}</span>.
        </p>

        <div className="relative mt-8">
          <label htmlFor="verification-code" className="sr-only">8-digit verification code</label>
          <input
            id="verification-code"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void handleVerify()
              }
            }}
            maxLength={8}
            aria-invalid={!!error}
            aria-describedby={error ? 'verification-error' : undefined}
            className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
          />
          <div aria-hidden="true" className="flex gap-1.5 sm:gap-2">
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} className={`flex h-12 min-w-0 flex-1 items-center justify-center rounded-[10px] border bg-warm-cream font-mono text-xl font-bold text-ink transition ${error ? 'border-red-700' : index === code.length ? 'border-blue-accent ring-2 ring-blue-accent/20' : 'border-ink/15'}`}>
                {code[index] ?? ''}
              </span>
            ))}
          </div>
        </div>

        {error && <p id="verification-error" role="alert" className="mt-4 rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

        {message && <p className="mt-4 rounded-xl border border-blue-accent/25 bg-blue-accent/10 px-4 py-3 text-[13px] text-ink">{message}</p>}

        <Button className="mt-5" fullWidth disabled={!canVerify} onClick={handleVerify}>
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" fullWidth disabled={!canResend} onClick={handleResend}>
            {resendLoading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </Button>
          <Button variant="secondary" fullWidth onClick={handleChangeEmail}>
            Change email
          </Button>
        </div>

        <p className="mt-4 text-[12px] text-ink/45">
          {roleParam === 'founder'
            ? 'After verification, we will continue your founder onboarding.'
            : 'After verification, we will continue your investor flow.'}
        </p>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-text-secondary font-body">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
