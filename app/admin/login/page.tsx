'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { AuthShell } from '@/components/AuthShell'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        setError('Invalid admin password.')
        return
      }

      router.replace('/admin')
    } catch {
      setError('Admin login is unavailable right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell kicker="Internal access">
      <div>
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="font-serif text-4xl font-semibold tracking-[-.04em] text-ink">Stage Zero</h1>
          <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-amber">Admin Panel</p>
        </div>

        {/* Login card */}
        <Card className="border-0 bg-transparent p-0 shadow-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="admin-password"
              type="password"
              label="Admin Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoFocus
            />

            {error && (
              <p className="rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              fullWidth
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-ink/45">
          Internal access only. Unauthorized access is prohibited.
        </p>
      </div>
    </AuthShell>
  )
}
