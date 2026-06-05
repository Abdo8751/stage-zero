'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/auth'
import { useUser } from '@/hooks/useUser'
import { validateEmail, validatePassword } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { Camera, User, Lock, Trash2, Bell, ArrowLeft, RefreshCw, Rocket, Briefcase, AlertTriangle } from 'lucide-react'

const PREFS_KEY = 'stage-zero-email-prefs'

function AvatarUpload({
  avatarUrl,
  name,
  onChange,
}: {
  avatarUrl: string | null
  name: string | null
  onChange: (file: File) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const initials = (name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-5">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="group relative flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-[rgba(75,124,246,0.35)] shadow-[0_0_0_4px_rgba(75,124,246,0.10)] transition-all hover:border-[rgba(75,124,246,0.6)]"
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name ?? ''} width={80} height={80} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[rgba(75,124,246,0.3)] to-[rgba(75,124,246,0.08)]">
            <span className="text-[24px] font-black text-blue-bright">{initials}</span>
          </div>
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-[rgba(240,228,200,0.07)] opacity-0 transition-opacity group-hover:opacity-100">
          <Camera className="h-5 w-5 text-cream" />
        </div>
      </button>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])} />
      <div>
        <p className="text-[14px] font-semibold text-cream">{name ?? 'Your name'}</p>

        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="mt-1 text-[12px] text-blue-bright hover:underline cursor-pointer"
        >
          Change photo
        </button>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, startup, loading, refresh } = useUser()
  const { showToast } = useToast()

  const [fullName, setFullName]     = useState('')
  const [email, setEmail]           = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [emailPrefs, setEmailPrefs] = useState(true)
  const [pauseListing, setPauseListing] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [errors, setErrors]         = useState<Record<string, string>>({})
  const [showSwitchModal, setShowSwitchModal] = useState(false)
  const [switching, setSwitching]   = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '')
      setEmail(user.email)
    }
    if (startup) setPauseListing(!startup.is_active)
    try {
      setEmailPrefs(JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'true') as boolean)
    } catch {
      setEmailPrefs(true)
    }
  }, [user, startup])

  const handleAvatarChange = (file: File) => {
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const errs: Record<string, string> = {}
    const emailErr = validateEmail(email)
    if (emailErr) errs.email = emailErr
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      const supabase = createClient()
      let avatarUrl = user.avatar_url

      if (avatarFile) {
        avatarUrl = await uploadAvatar(user.id, avatarFile)
      }

      const { error: userError } = await supabase
        .from('users')
        .update({ full_name: fullName.trim(), avatar_url: avatarUrl })
        .eq('id', user.id)
      if (userError) throw userError

      if (email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: email.trim() })
        if (emailError) throw emailError
      }

      if (user.role === 'founder' && startup) {
        const { error: startupError } = await supabase
          .from('startups')
          .update({ is_active: !pauseListing })
          .eq('id', startup.id)
        if (startupError) throw startupError
      }

      localStorage.setItem(PREFS_KEY, JSON.stringify(emailPrefs))
      showToast('Profile updated', 'success')
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    const passwordErr = validatePassword(newPassword)
    if (passwordErr) { setErrors({ password: passwordErr }); return }

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      showToast('Password updated', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Password update failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSwitchRole = async () => {
    if (!user) return
    const newRole = user.role === 'founder' ? 'investor' : 'founder'
    setSwitching(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const res = await fetch('/api/auth/switch-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ newRole }),
      })
      const result = await res.json() as { error?: string }
      if (!res.ok) throw new Error(result.error ?? 'Switch failed')

      showToast(`Switched to ${newRole} mode`, 'success')
      setShowSwitchModal(false)
      await refresh()
      router.push(newRole === 'founder' ? '/dashboard' : '/investor/verify')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Switch failed', 'error')
    } finally {
      setSwitching(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('delete_user')
      if (error) await supabase.auth.signOut()
      showToast('Account deleted', 'success')
      router.push('/')
    } catch {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 pt-24 pb-12 space-y-4">
        <div className="shimmer h-8 w-32 rounded-[8px]" />
        <div className="shimmer h-64 rounded-card" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-20 pb-16">

      <div className="mb-8">
        <button
          type="button"
          onClick={() => router.push(user?.role === 'investor' ? '/browse' : '/dashboard')}
          className="mb-4 flex items-center gap-1.5 text-[13px] text-cream-muted hover:text-cream transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <h1 className="text-[32px] font-black tracking-tightest text-cream">Settings</h1>
        <p className="mt-1 text-[14px] text-cream-muted">Manage your profile and account preferences.</p>
      </div>

      {/* â”€â”€ Profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-blue-bright" />
          <h2 className="text-[13px] font-bold uppercase tracking-[0.10em] text-blue-bright">Profile</h2>
        </div>
        <Card>
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <AvatarUpload
              avatarUrl={avatarPreview ?? user?.avatar_url ?? null}
              name={fullName || (user?.full_name ?? null)}
              onChange={handleAvatarChange}
            />

            <Input
              label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="you@example.com"
            />

            {/* Notification pref */}
            <label className="flex cursor-pointer items-center justify-between rounded-input border border-glass-border bg-[rgba(255,255,255,0.03)] px-4 py-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-cream-muted" />
                <span className="text-[13px] font-medium text-cream">Email notifications</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={emailPrefs}
                onClick={() => setEmailPrefs(!emailPrefs)}
                className={`relative h-5 w-9 rounded-full transition-colors duration-200 ${
                  emailPrefs ? 'bg-blue-accent' : 'bg-[rgba(255,255,255,0.12)]'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-cream shadow transition-transform duration-200 ${
                  emailPrefs ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </label>

            {user?.role === 'founder' && startup && (
              <label className="flex cursor-pointer items-center justify-between rounded-input border border-glass-border bg-[rgba(255,255,255,0.03)] px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-cream">Pause listing</p>
                  <p className="text-[12px] text-cream-subtle">Hide your startup from investor browse</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={pauseListing}
                  onClick={() => setPauseListing(!pauseListing)}
                  className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-200 ${
                    pauseListing ? 'bg-[rgba(255,69,58,0.7)]' : 'bg-[rgba(255,255,255,0.12)]'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-cream shadow transition-transform duration-200 ${
                    pauseListing ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </label>
            )}

            <Button type="submit" fullWidth disabled={saving}>
              {saving ? 'Savingâ€¦' : 'Save profile'}
            </Button>
          </form>
        </Card>
      </section>

      {/* â”€â”€ Password â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Lock className="h-4 w-4 text-blue-bright" />
          <h2 className="text-[13px] font-bold uppercase tracking-[0.10em] text-blue-bright">Password</h2>
        </div>
        <Card>
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 8 characters"
            error={errors.password}
          />
          <Button
            type="button"
            variant="secondary"
            fullWidth
            className="mt-4"
            disabled={saving}
            onClick={handleChangePassword}
          >
            Update password
          </Button>
        </Card>
      </section>

      {/* â”€â”€ Switch role â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {user && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-amber" />
            <h2 className="text-[13px] font-bold uppercase tracking-[0.10em] text-amber">Switch role</h2>
          </div>
          <Card className="border-[rgba(232,165,60,0.18)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[14px] font-semibold text-cream">
                  Currently: <span className="capitalize">{user.role}</span>
                </p>
                <p className="mt-0.5 text-[12px] text-cream-muted">
                  Switch to {user.role === 'founder' ? 'investor' : 'founder'} mode to access the other side of the platform.
                </p>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(232,165,60,0.12)] border border-[rgba(232,165,60,0.20)]">
                {user.role === 'founder'
                  ? <Briefcase className="h-4.5 w-4.5 text-amber" />
                  : <Rocket className="h-4.5 w-4.5 text-amber" />}
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              className="mt-4 border-[rgba(232,165,60,0.25)] hover:border-[rgba(232,165,60,0.45)]"
              onClick={() => setShowSwitchModal(true)}
            >
              Switch to {user.role === 'founder' ? 'investor' : 'founder'} mode
            </Button>
          </Card>
        </section>
      )}

      {/* â”€â”€ Danger zone â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-[#FF453A]" />
          <h2 className="text-[13px] font-bold uppercase tracking-[0.10em] text-[#FF453A]">Danger zone</h2>
        </div>
        <Card className="border-[rgba(255,69,58,0.20)]">
          <p className="text-[13px] text-cream-muted">
            Permanently delete your account and all associated data. This cannot be undone.
          </p>
          <Button
            type="button"
            variant="destructive"
            fullWidth
            className="mt-4"
            disabled={saving}
            onClick={handleDeleteAccount}
          >
            Delete account
          </Button>
        </Card>
      </section>

      {/* â”€â”€ Switch role modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showSwitchModal && user && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-6 sm:pb-0">
          <div className="w-full max-w-md rounded-2xl border border-[rgba(240,230,208,0.14)] bg-[rgba(6,14,36,0.96)] p-6 shadow-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(232,165,60,0.12)] border border-[rgba(232,165,60,0.22)]">
                <AlertTriangle className="h-5 w-5 text-amber" />
              </div>
              <div>
                <h2 className="text-[17px] font-black text-cream">
                  Switch to {user.role === 'founder' ? 'investor' : 'founder'} mode?
                </h2>
                <p className="mt-1 text-[13px] text-cream-muted leading-relaxed">
                  {user.role === 'founder'
                    ? 'You\'ll be redirected to complete investor verification before accessing the investor dashboard.'
                    : 'Your existing investor profile stays intact. You\'ll set up or continue your founder profile.'}
                </p>
              </div>
            </div>
            <p className="text-[12px] text-cream-subtle mb-5">
              You can always switch back from Settings.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowSwitchModal(false)}
                className="flex-1 rounded-[10px] border border-[rgba(240,230,208,0.18)] py-2.5 text-[14px] font-medium text-cream-muted hover:text-cream transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSwitchRole}
                disabled={switching}
                className="flex-1 rounded-[10px] bg-[rgba(232,165,60,0.90)] py-2.5 text-[14px] font-bold text-navy hover:bg-amber transition-colors cursor-pointer disabled:opacity-50"
              >
                {switching ? 'Switchingâ€¦' : 'Confirm switch'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

