'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Hardcoded password check
    if (password !== 'stagezero2026') {
      setError('Invalid admin password.')
      setLoading(false)
      return
    }

    // Set cookie with 24h expiry
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `admin_auth=true; path=/; expires=${expires}; SameSite=Lax`

    router.replace('/admin')
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="font-heading text-4xl font-bold text-text-primary">
            STAGE <span className="italic font-light text-gold font-heading">Zero</span>
          </h1>
          <p className="mt-1 font-body text-xs tracking-wider uppercase text-text-secondary">Admin Panel</p>
        </div>

        {/* Login card */}
        <Card className="p-8">
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
              <p className="rounded-[8px] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 font-body">
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

        <p className="mt-6 text-center text-xs text-text-tertiary font-body">
          Internal access only. Unauthorized access is prohibited.
        </p>
      </div>
    </div>
  )
}
