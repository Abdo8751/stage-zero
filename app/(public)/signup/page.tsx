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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
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

      // Insert into public.users immediately after auth signup
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email: data.user.email ?? email.trim(),
          role,
          full_name: fullName.trim(),
          is_verified: role === 'founder',
        })

      if (profileError) {
        setError(profileError.message)
        showToast(profileError.message, 'error')
        return
      }

      if (role === 'investor') {
        const { error: investorError } = await supabase
          .from('investors')
          .insert({
            user_id: data.user.id,
            verification_status: 'pending',
            credits: 3,
          })
        if (investorError) {
          setError(investorError.message)
          showToast(investorError.message, 'error')
          return
        }
      }

      showToast('Account created successfully!', 'success')
      
      // Then redirect based on role
      if (role === 'founder') {
        router.push('/onboarding')
      } else {
        router.push('/investor/verify')
      }
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
        <h1 className="text-3xl sm:text-4xl text-text-primary">Join Stage Zero</h1>
        <p className="mt-3 text-text-secondary font-body">Egypt&apos;s premium founder-investor network</p>
      </div>

      {step === 'role' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => handleRoleSelect('founder')} className="w-full text-left block">
            <Card hoverable className="h-full">
              <Rocket className="h-8 w-8 text-gold" />
              <h2 className="mt-4 text-xl sm:text-2xl text-text-primary">I&apos;m a Founder</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary font-body font-light">
                List your startup and connect with verified investors.
              </p>
            </Card>
          </button>
          <button type="button" onClick={() => handleRoleSelect('investor')} className="w-full text-left block">
            <Card hoverable className="h-full">
              <Briefcase className="h-8 w-8 text-gold" />
              <h2 className="mt-4 text-xl sm:text-2xl text-text-primary">I&apos;m an Investor</h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary font-body font-light">
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
            className="mb-6 text-sm text-text-secondary hover:text-text-primary transition-colors font-body"
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
              <label className="flex items-start gap-3 text-sm text-text-secondary cursor-pointer font-body">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-1 accent-gold rounded border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)]"
                />
                <span>I confirm I am 18 years of age or older</span>
              </label>
              {fieldErrors.age && (
                <p className="mt-1 text-sm text-red-400 font-body">{fieldErrors.age}</p>
              )}
            </div>

            {error && (
              <p className="rounded-[8px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-body">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.12)]" />
            <span className="text-xs uppercase tracking-wider text-text-tertiary font-body">or</span>
            <div className="h-px flex-1 bg-[rgba(255,255,255,0.12)]" />
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

      <p className="mt-8 text-center text-sm text-text-secondary font-body">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-text-primary hover:text-gold transition-colors underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-text-secondary font-body">Loading...</div>}>
      <SignUpForm />
    </Suspense>
  )
}
