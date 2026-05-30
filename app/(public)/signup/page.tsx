'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getPostAuthRedirect, setupUserProfile } from '@/lib/auth'
import type { UserRole } from '@/lib/types'
import { validateEmail, validatePassword } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const initialRole = searchParams.get('role') as UserRole | null

  const [step, setStep] = useState<'role' | 'form'>(initialRole ? 'form' : 'role')
  const [role, setRole] = useState<UserRole | null>(
    initialRole === 'founder' || initialRole === 'investor' ? initialRole : null
  )
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole)
    setStep('form')
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    if (emailErr) errors.email = emailErr
    if (passwordErr) errors.password = passwordErr
    if (!ageConfirmed) errors.age = 'You must confirm you are 18 or older'
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) return
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { role } },
      })

      if (signUpError) {
        setError(signUpError.message)
        showToast(signUpError.message, 'error')
        return
      }

      if (!data.user) {
        setError('Sign up failed. Please try again.')
        return
      }

      if (!data.session) {
        showToast('Check your email to confirm your account before logging in.', 'info')
        router.push('/login')
        return
      }

      const profileError = await setupUserProfile(role, email.trim())
      if (profileError) {
        setError(profileError)
        showToast(profileError, 'error')
        return
      }

      showToast('Account created successfully!', 'success')
      router.push(getPostAuthRedirect(role))
      router.refresh()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    if (!role) return
    if (!ageConfirmed) {
      setFieldErrors({ age: 'You must confirm you are 18 or older' })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?role=${role}`,
        },
      })

      if (oauthError) {
        setError(oauthError.message)
        showToast(oauthError.message, 'error')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OAuth failed'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12 sm:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl">Join Stage Zero</h1>
        <p className="mt-3 text-muted">Egypt&apos;s premium founder-investor network</p>
      </div>

      {step === 'role' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => handleRoleSelect('founder')} className="w-full text-left">
            <Card className="h-full transition-colors hover:border-gold/60 hover:bg-white/60">
              <span className="text-2xl">🚀</span>
              <h2 className="mt-4 text-xl sm:text-2xl">I&apos;m a Founder</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                List your startup and connect with verified investors.
              </p>
            </Card>
          </button>
          <button type="button" onClick={() => handleRoleSelect('investor')} className="w-full text-left">
            <Card className="h-full transition-colors hover:border-gold/60 hover:bg-white/60">
              <span className="text-2xl">💼</span>
              <h2 className="mt-4 text-xl sm:text-2xl">I&apos;m an Investor</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Browse curated startups and express verified interest.
              </p>
            </Card>
          </button>
        </div>
      )}

      {step === 'form' && role && (
        <Card>
          <button
            type="button"
            onClick={() => setStep('role')}
            className="mb-6 text-sm text-muted hover:text-navy"
          >
            ← Change role ({role === 'founder' ? 'Founder' : 'Investor'})
          </button>

          <form onSubmit={handleEmailSignUp} className="space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              error={fieldErrors.email}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              error={fieldErrors.password}
            />

            <div>
              <label className="flex items-start gap-3 text-sm text-muted">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-1 accent-navy"
                />
                <span>I confirm I am 18 years of age or older</span>
              </label>
              {fieldErrors.age && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.age}</p>
              )}
            </div>

            {error && (
              <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-muted/30" />
            <span className="text-xs uppercase tracking-wider text-muted">or</span>
            <div className="h-px flex-1 bg-muted/30" />
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth
            disabled={loading}
            onClick={handleGoogleSignUp}
          >
            Continue with Google
          </Button>
        </Card>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-navy underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">Loading…</div>}>
      <SignUpForm />
    </Suspense>
  )
}
