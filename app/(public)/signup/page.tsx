'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getNormalizedEmail, setPendingVerificationEmail } from '@/lib/auth'
import type { UserRole } from '@/lib/types'
import { validateEmail, validatePassword } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { AuthShell } from '@/components/AuthShell'
import { Rocket, Briefcase } from 'lucide-react'

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const initialRole = searchParams.get('role') as UserRole | null

  const [step, setStep] = useState<'role' | 'form'>(initialRole ? 'form' : 'role')
  const [role, setRole] = useState<UserRole | null>(
    initialRole === 'founder' || initialRole === 'investor' ? initialRole : null
  )
  const [fullName, setFullName] = useState('')
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
    if (!fullName.trim()) errors.fullName = 'Full name is required'
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
      const normalizedEmail = getNormalizedEmail(email)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            role,
            full_name: fullName.trim(),
          },
        },
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

      // Supabase intentionally returns a generic successful response for an
      // existing email. Send that account through login, which can identify an
      // unconfirmed account and request a code without misleading verified users.
      if (data.user.identities?.length === 0) {
        showToast('This email already has an account. Please log in.', 'error')
        router.push(`/login?email=${encodeURIComponent(normalizedEmail)}`)
        return
      }

      setPendingVerificationEmail(normalizedEmail)

      showToast('Check your email for the verification code.', 'success')
      router.push(`/auth/verify-email?email=${encodeURIComponent(normalizedEmail)}&role=${role}`)
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
      const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?role=${role}`,
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
    <AuthShell kicker="Create account" wide>
      <div className="mb-8">
        <h1 className="font-serif text-[42px] font-semibold tracking-[-.04em] text-ink">Join Stage Zero</h1>
        <p className="mt-3 text-[15px] font-normal leading-6 text-ink/60">Choose how you want to get started.</p>
      </div>

      {step === 'role' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => handleRoleSelect('founder')} className="w-full text-left block">
            <Card hoverable className="h-full border-ink/10 bg-paper/70">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-cream"><Rocket className="h-5 w-5 text-amber" /></span>
              <h2 className="mt-7 text-lg font-semibold text-ink">I&apos;m a Founder</h2>
              <p className="mt-2 text-sm font-normal leading-relaxed text-ink/55">
                List your startup and connect with verified investors.
              </p>
            </Card>
          </button>
          <button type="button" onClick={() => handleRoleSelect('investor')} className="w-full text-left block">
            <Card hoverable className="h-full border-ink/10 bg-paper/70">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-cream"><Briefcase className="h-5 w-5 text-amber" /></span>
              <h2 className="mt-7 text-lg font-semibold text-ink">I&apos;m an Investor</h2>
              <p className="mt-2 text-sm font-normal leading-relaxed text-ink/55">
                Browse curated startups and express verified interest.
              </p>
            </Card>
          </button>
        </div>
      )}

      {step === 'form' && role && (
        <Card className="border-0 bg-transparent p-0 shadow-none">
          <button
            type="button"
            onClick={() => setStep('role')}
            className="mb-6 text-sm font-medium text-ink/60 transition-colors hover:text-ink"
          >
            ← Change role ({role === 'founder' ? 'Founder' : 'Investor'})
          </button>

          <form onSubmit={handleEmailSignUp} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              error={fieldErrors.fullName}
            />
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
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ink/65">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-1 rounded border-ink/15 accent-blue-accent"
                />
                <span>I confirm I am 18 years of age or older</span>
              </label>
              {fieldErrors.age && <p className="mt-1 text-sm text-red-700">{fieldErrors.age}</p>}
            </div>

            {error && (
              <p className="rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-ink/10" />
            <span className="text-xs uppercase tracking-wider text-ink/40">or</span>
            <div className="h-px flex-1 bg-ink/10" />
          </div>

          <Button type="button" variant="secondary" fullWidth disabled={loading} onClick={handleGoogleSignUp}>
            Continue with Google
          </Button>
        </Card>
      )}

      <p className="mt-8 text-center text-sm text-ink/60">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-blue-accent transition-colors hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-text-secondary font-body">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}
