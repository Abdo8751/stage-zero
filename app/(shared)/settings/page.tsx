'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { uploadAvatar } from '@/lib/auth'
import { useUser } from '@/hooks/useUser'
import { validateEmail, validatePassword } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

const PREFS_KEY = 'stage-zero-email-prefs'

export default function SettingsPage() {
  const router = useRouter()
  const { user, startup, loading, refresh } = useUser()
  const { showToast } = useToast()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [emailPrefs, setEmailPrefs] = useState(true)
  const [pauseListing, setPauseListing] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '')
      setEmail(user.email)
    }
    if (startup) {
      setPauseListing(!startup.is_active)
    }
    try {
      setEmailPrefs(JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'true') as boolean)
    } catch {
      setEmailPrefs(true)
    }
  }, [user, startup])

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
      showToast('Settings saved', 'success')
      await refresh()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    const passwordErr = validatePassword(newPassword)
    if (passwordErr) {
      setErrors({ password: passwordErr })
      return
    }

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

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('delete_user')
      if (error) {
        await supabase.auth.signOut()
      }
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

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">Settings</h1>

      <Card className="mt-8">
        <form onSubmit={handleSaveProfile} className="space-y-5">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-navy">Avatar</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          </div>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={emailPrefs}
              onChange={(e) => setEmailPrefs(e.target.checked)}
              className="accent-navy"
            />
            Email notifications
          </label>

          {user?.role === 'founder' && startup && (
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={pauseListing}
                onChange={(e) => setPauseListing(e.target.checked)}
                className="accent-navy"
              />
              Pause listing
            </label>
          )}

          <Button type="submit" fullWidth disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
        </form>
      </Card>

      <Card className="mt-6">
        <h2 className="text-lg">Change password</h2>
        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.password}
          className="mt-4"
        />
        <Button
          variant="secondary"
          className="mt-4"
          fullWidth
          disabled={saving}
          onClick={handleChangePassword}
        >
          Update password
        </Button>
      </Card>

      <Card className="mt-6 border-red-200">
        <h2 className="text-lg text-red-700">Danger zone</h2>
        <p className="mt-2 text-sm text-muted">Permanently delete your account and data.</p>
        <Button
          variant="secondary"
          className="mt-4 border-red-300 text-red-700"
          fullWidth
          disabled={saving}
          onClick={handleDeleteAccount}
        >
          Delete account
        </Button>
      </Card>
    </div>
  )
}
