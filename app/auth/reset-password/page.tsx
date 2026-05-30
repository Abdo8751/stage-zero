'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { validatePassword } from '@/lib/validation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

function ResetPasswordForm() {
  const router = useRouter()
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errors: Record<string, string> = {}
    const passwordErr = validatePassword(password)
    if (passwordErr) errors.password = passwordErr
    if (password !== confirm) errors.confirm = 'Passwords do not match'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        showToast(error.message, 'error')
        return
      }

      showToast('Password updated successfully', 'success')
      router.push('/login')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl">Reset password</h1>
        <p className="mt-3 text-muted">Enter your new password</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={fieldErrors.confirm}
          />
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-muted">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
