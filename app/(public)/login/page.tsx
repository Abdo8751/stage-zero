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
import type { UserRole } from '@/lib/types'
import { Rocket, Briefcase } from 'lucide-react'

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
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState<any>(null)

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const emailErr = validateEmail(email)
    const passwordErr = validatePassword(password)
    if (emailErr) errors.email = emailErr
    if (passwordErr) errors.password = passwordErr
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePostLogin = async (
    user: any,
    profile: { role: UserRole; is_verified: boolean }
  ) => {
    const supabase = createClient()
    let hasStartup = false
    let investorApproved = profile.is_verified

    if (profile.role === 'founder') {
      const { data: startup, error: startupError } = await supabase
        .from('startups')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
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
        .eq('user_id', user.id)
        .maybeSingle()

      if (investorError) {
        setError(investorError.message)
        return
      }
      investorApproved =
        profile.is_verified && investor?.verification_status === 'approved'
    }

    const destination =
      redirect ??
      getLoginRedirect(profile.role, profile.is_verified, investorApproved, hasStartup)

    showToast('Welcome back!', 'success')
    window.location.href = destination
  }

  const handleRoleSelection = async (selectedRole: UserRole) => {
    if (!loggedInUser) return
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: loggedInUser.id,
          email: loggedInUser.email,
          role: selectedRole,
          full_name: loggedInUser.user_metadata?.full_name || loggedInUser.email,
          is_verified: selectedRole === 'founder',
        })

      if (insertError) {
        setError(insertError.message)
        showToast(insertError.message, 'error')
        return
      }

      if (selectedRole === 'investor') {
        const { error: investorError } = await supabase
          .from('investors')
          .insert({
            user_id: loggedInUser.id,
            verification_status: 'pending',
            credits: 3,
          })
        if (investorError) {
          setError(investorError.message)
          showToast(investorError.message, 'error')
          return
        }
      }

      await handlePostLogin(loggedInUser, {
        role: selectedRole,
        is_verified: selectedRole === 'founder',
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create profile'
      setError(message)
      showToast(message, 'error')
    } finally {
      setLoading(false)
    }
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
          setLoggedInUser(data.user)
          setShowRoleSelector(true)
          return
        }

        await handlePostLogin(data.user, profile)
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

  if (showRoleSelector) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
        <div className="mb-10 text-center">
          <h1 className="text-[30px] font-bold tracking-[-0.03em] text-text-primary sm:text-[36px]">Complete your profile</h1>
          <p className="mt-2.5 text-[14px] text-text-secondary">Select your role to continue.</p>
        </div>

        <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
          <button type="button" onClick={() => handleRoleSelection('founder')} disabled={loading} className="w-full text-left focus:outline-none">
            <Card hoverable className="h-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(212,168,83,0.12)] border border-[rgba(212,168,83,0.20)]">
                <Rocket className="h-5 w-5 text-gold" />
              </div>
              <h2 className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-text-primary">I&apos;m a Founder</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">List your startup and connect with verified investors.</p>
            </Card>
          </button>
          <button type="button" onClick={() => handleRoleSelection('investor')} disabled={loading} className="w-full text-left focus:outline-none">
            <Card hoverable className="h-full">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(212,168,83,0.12)] border border-[rgba(212,168,83,0.20)]">
                <Briefcase className="h-5 w-5 text-gold" />
              </div>
              <h2 className="mt-4 text-[17px] font-semibold tracking-[-0.02em] text-text-primary">I&apos;m an Investor</h2>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">Browse curated startups and express verified interest.</p>
            </Card>
          </button>
        </div>

        {error && (
          <p className="mt-6 w-full max-w-lg rounded-input border border-[rgba(255,69,58,0.25)] bg-[rgba(255,69,58,0.08)] px-4 py-3 text-[13px] text-[#FF453A] text-center">
            {error}
          </p>
        )}

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              setShowRoleSelector(false)
              setLoggedInUser(null)
              setError(null)
            }}
            className="text-[13px] text-text-tertiary hover:text-text-secondary transition-colors underline underline-offset-4 cursor-pointer"
          >
            Cancel and log out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      {/* Glow behind card */}
      <div className="pointer-events-none absolute h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(212,168,83,0.05)_0%,transparent_65%)] blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex items-center justify-center gap-1">
            <span className="text-[15px] font-black tracking-[-0.04em] text-cream uppercase">STAGE ZERO</span>
          </div>
          <h1 className="text-[28px] font-black tracking-tightest text-cream">Welcome back</h1>
          <p className="mt-1.5 text-[13px] text-cream-muted">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
                className="text-[12px] text-text-tertiary hover:text-gold transition-colors cursor-pointer"
                disabled={loading}
              >
                Forgot password?
              </button>
            </div>

            {resetSent && (
              <p className="rounded-input border border-[rgba(52,199,89,0.22)] bg-[rgba(52,199,89,0.08)] px-4 py-3 text-[13px] text-[#30D158]">
                Reset link sent — check your inbox.
              </p>
            )}

            {error && (
              <p className="rounded-input border border-[rgba(255,69,58,0.25)] bg-[rgba(255,69,58,0.08)] px-4 py-3 text-[13px] text-[#FF453A]">
                {error}
              </p>
            )}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-glass-border" />
            <span className="text-[11px] uppercase tracking-[0.10em] text-text-tertiary">or</span>
            <div className="h-px flex-1 bg-glass-border" />
          </div>

          <Button type="button" variant="secondary" fullWidth disabled={loading} onClick={handleGoogleLogin}>
            Continue with Google
          </Button>
        </Card>

        <p className="mt-6 text-center text-[13px] text-text-secondary">
          No account?{' '}
          <Link href="/signup" className="font-medium text-text-primary hover:text-gold transition-colors underline underline-offset-4">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-text-secondary font-body">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
