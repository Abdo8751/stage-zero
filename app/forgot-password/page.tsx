'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthShell } from '@/components/AuthShell'
import { useToast } from '@/components/ui/Toast'
import { sendPasswordResetEmail } from '@/lib/auth'
import { validateEmail } from '@/lib/validation'

export default function ForgotPasswordPage() {
  const { showToast } = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (new URLSearchParams(window.location.search).get('error') === 'expired_link') {
      setMessage('That reset link is invalid or expired. Request a new one below.')
    }
  }, [])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailErr = validateEmail(email)
    if (emailErr) {
      setError(emailErr)
      return
    }
    if (cooldown > 0) return

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { error: resetError } = await sendPasswordResetEmail(email)
      if (resetError && !/rate|too many/i.test(resetError.message)) {
        throw resetError
      }

      setCooldown(60)
      setMessage("If an account exists for that email, we've sent password-reset instructions.")
      showToast('If an account exists, check your email for reset instructions.', 'success')
    } catch {
      setMessage("If an account exists for that email, we've sent password-reset instructions.")
      showToast('We could not send the reset email right now. Please try again later.', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell kicker="Password recovery">
        <Link href="/login" className="mb-7 block text-sm font-medium text-ink/60 hover:text-ink">← Back to log in</Link>
        <h1 className="font-serif text-[38px] font-semibold tracking-[-.04em] text-ink">Forgot your password?</h1>
        <p className="mt-3 text-[15px] font-normal leading-6 text-ink/60">
          Enter the email on your Stage Zero account and we&apos;ll send a secure reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            ref={inputRef}
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            error={error ?? undefined}
          />

          {message && (
            <p className="rounded-xl border border-blue-accent/25 bg-blue-accent/10 px-4 py-3 text-[13px] text-ink">
              {message}
            </p>
          )}

          <Button type="submit" fullWidth disabled={loading || cooldown > 0}>
            {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send reset link'}
          </Button>
        </form>

        <p className="mt-5 text-center text-[12px] font-normal leading-5 text-ink/45">For privacy, the response is the same whether or not an account exists.</p>
    </AuthShell>
  )
}
