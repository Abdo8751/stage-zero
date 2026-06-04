'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getSavedStartupIds, toggleSavedStartup } from '@/lib/auth'
import { StartupCard } from '@/components/StartupCard'
import { Button } from '@/components/ui/Button'
import type { Startup } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function SavedPage() {
  const router = useRouter()
  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSaved = useCallback(async () => {
    setLoading(true)
    setError(null)
    const ids = getSavedStartupIds()

    if (ids.length === 0) {
      setStartups([])
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('startups')
        .select('*')
        .in('id', ids)

      if (fetchError) throw fetchError
      setStartups((data ?? []) as Startup[])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load saved startups')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSaved()
  }, [fetchSaved])

  const handleRemove = (id: string) => {
    toggleSavedStartup(id)
    setStartups((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => router.push('/browse')}
        className="mb-5 flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to browse
      </button>
      <h1 className="text-3xl sm:text-4xl">Saved list</h1>
      <p className="mt-2 text-muted">Startups you bookmarked</p>

      {loading && <p className="mt-8 text-muted">Loading…</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}

      {!loading && startups.length === 0 && (
        <div className="mt-12 text-center">
          <p className="text-muted">No saved startups yet.</p>
          <Link href="/browse" className="mt-6 inline-block">
            <Button>Browse startups</Button>
          </Link>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {startups.map((startup) => (
          <div key={startup.id} className="relative">
            <StartupCard startup={startup} href={`/startup/${startup.id}`} />
            <button
              type="button"
              onClick={() => handleRemove(startup.id)}
              className="mt-2 text-sm text-red-600 hover:underline"
            >
              Remove from saved
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
