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
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
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
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <Card className="w-full max-w-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-tertiary">Email verification</p>
        <h1 className="mt-2 text-[28px] font-black tracking-tight text-cream">Verify your email</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-cream-muted">
          Enter the 8-digit code we sent to{' '}
          <span className="font-semibold text-cream">{normalizedEmail || 'your email address'}</span>.
        </p>

        <div className="mt-6">
          <Input
            ref={inputRef}
            label="Verification code"
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
            placeholder="123456"
            error={error ?? undefined}
            maxLength={8}
          />
        </div>

        {message && <p className="mt-4 rounded-input border border-[rgba(52,199,89,0.22)] bg-[rgba(52,199,89,0.08)] px-4 py-3 text-[13px] text-[#30D158]">{message}</p>}

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

        <p className="mt-4 text-[12px] text-text-tertiary">
          {roleParam === 'founder'
            ? 'After verification, we will continue your founder onboarding.'
            : 'After verification, we will continue your investor flow.'}
        </p>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-text-secondary font-body">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
