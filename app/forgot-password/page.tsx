'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
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
    <div className="flex min-h-screen items-center justify-center px-5 py-16">
      <Card className="w-full max-w-md">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-text-tertiary">Account recovery</p>
        <h1 className="mt-2 text-[28px] font-black tracking-tight text-cream">Forgot your password?</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-cream-muted">
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
            <p className="rounded-input border border-[rgba(52,199,89,0.22)] bg-[rgba(52,199,89,0.08)] px-4 py-3 text-[13px] text-[#30D158]">
              {message}
            </p>
          )}

          <Button type="submit" fullWidth disabled={loading || cooldown > 0}>
            {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send reset link'}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-[13px]">
          <Link href="/login" className="text-text-secondary hover:text-text-primary transition-colors underline underline-offset-4">
            Back to login
          </Link>
          <span className="text-text-tertiary">Generic response to protect account privacy</span>
        </div>
      </Card>
    </div>
  )
}
