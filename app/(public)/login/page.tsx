'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getLoginRedirect } from '@/lib/auth'
import { validateEmail, validatePassword } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const authError = searchParams.get('error')
  const redirect = searchParams.get('redirect')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(
    authError ? 'Authentication failed. Please try again.' : null
  )
  const [resetSent, setResetSent] = useState(false)

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    if (emailErr) errors.email = emailErr
    if (passwordErr) errors.password = passwordErr
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (loginError) {
        setError(loginError.message)
        showToast(loginError.message, 'error')
        return
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role, is_verified')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) {
          setError(profileError.message)
          showToast(profileError.message, 'error')
          return
        }

        if (!profile) {
          router.push('/signup')
          return
        }

        let hasStartup = false
        let investorApproved = profile.is_verified

        if (profile.role === 'founder') {
          const { data: startup, error: startupError } = await supabase
            .from('startups')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle()

          if (startupError) {
            setError(startupError.message)
            return
          }
          hasStartup = !!startup
        } else {
          const { data: investor, error: investorError } = await supabase
            .from('investors')
            .select('verification_status')
            .eq('user_id', data.user.id)
            .maybeSingle()

          if (investorError) {
            setError(investorError.message)
            return
          }
          investorApproved =
            profile.is_verified && investor?.verification_status === 'approved'
        }

        showToast('Welcome back!', 'success')
        router.push(
          redirect ??
            getLoginRedirect(profile.role, profile.is_verified, investorApproved, hasStartup)
        )
        router.refresh()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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

  const handleForgotPassword = async () => {
    const emailErr = validateEmail(email)
    if (emailErr) {
      setFieldErrors({ email: emailErr })
      showToast('Enter a valid email first', 'error')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        showToast(resetError.message, 'error')
        return
      }

      setResetSent(true)
      showToast('Password reset link sent. Check your email.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Reset failed'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl">Welcome back</h1>
        <p className="mt-3 text-muted">Log in to your Stage Zero account</p>
      </div>

      <Card>
        <form onSubmit={handleEmailLogin} className="space-y-5">
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
            placeholder="Your password"
            autoComplete="current-password"
            error={fieldErrors.password}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-muted hover:text-navy"
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>

          {resetSent && (
            <p className="rounded border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Reset link sent. Check your inbox.
            </p>
          )}

          {error && (
            <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
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
          onClick={handleGoogleLogin}
        >
          Continue with Google
        </Button>
      </Card>

      <p className="mt-8 text-center text-sm text-muted">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-navy underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  )
}
