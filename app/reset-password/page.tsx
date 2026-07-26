'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { validatePassword } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { AuthShell } from '@/components/AuthShell'

function ResetPasswordForm() {
  const router = useRouter()
  const { showToast } = useToast()
  const newPasswordRef = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [expired, setExpired] = useState(false)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const verifyRecoverySession = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setExpired(true)
      } else {
        setSessionValid(true)
        newPasswordRef.current?.focus()
      }
      setCheckingSession(false)
    }

    void verifyRecoverySession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    const passwordErr = validatePassword(password)
    if (passwordErr) errors.password = passwordErr
    if (password !== confirm) errors.confirm = 'Passwords do not match'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0 || !sessionValid) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setSuccess(true)
      setPassword('')
      setConfirm('')
      showToast('Password updated successfully', 'success')
      await supabase.auth.signOut()
      router.replace('/login?message=password_updated')
    } catch {
      setFieldErrors({ password: 'We could not update your password. Please try again.' })
      showToast('Password update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return <div className="py-16 text-center text-text-secondary font-body">Loading...</div>
  }

  if (expired || !sessionValid) {
    return (
      <AuthShell kicker="Reset password">
        <Card className="border-0 bg-transparent p-0 text-center shadow-none">
          <div className="space-y-4 text-center">
            <h1 className="font-serif text-[38px] font-semibold tracking-[-.04em] text-ink">Reset link expired</h1>
            <p className="text-[14px] font-normal leading-relaxed text-ink/60">
              This reset link is missing, invalid, or already used. Please request a new one from the login page.
            </p>
            <Link href="/forgot-password" className="inline-flex text-[13px] text-text-primary underline underline-offset-4">
              Request a new reset link
            </Link>
          </div>
        </Card>
      </AuthShell>
    )
  }

  if (success) {
    return (
      <AuthShell kicker="Reset password">
        <Card className="border-0 bg-transparent p-0 text-center shadow-none">
          <div className="space-y-4 text-center">
            <h1 className="font-serif text-[38px] font-semibold tracking-[-.04em] text-ink">Password updated successfully</h1>
            <p className="text-[14px] font-normal leading-relaxed text-ink/60">
              Your password is now updated. Please sign in again with the new password.
            </p>
            <Link href="/login" className="inline-flex text-[13px] text-text-primary underline underline-offset-4">
              Back to login
            </Link>
          </div>
        </Card>
      </AuthShell>
    )
  }

  return (
    <AuthShell kicker="Reset password">
      <div className="mb-8">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
        >
          ← Back to login
        </Link>
        <h1 className="font-serif text-[38px] font-semibold tracking-[-.04em] text-ink">Create a new password</h1>
        <p className="mt-3 text-[15px] font-normal leading-6 text-ink/60">Choose a strong password you haven&apos;t used before.</p>
      </div>

      <Card className="border-0 bg-transparent p-0 shadow-none">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <Input
              ref={newPasswordRef}
              label="New password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              placeholder="Min 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-[34px] flex items-center text-text-tertiary hover:text-text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={fieldErrors.confirm}
              placeholder="Re-enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((value) => !value)}
              className="absolute right-3 top-[34px] flex items-center text-text-tertiary hover:text-text-primary"
              aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <p className="text-[12px] font-normal leading-relaxed text-ink/55">
            Password requirements: at least 8 characters.
          </p>

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Card>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
