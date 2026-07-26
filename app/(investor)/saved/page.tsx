'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { StartupCard } from '@/components/StartupCard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { Startup } from '@/lib/types'
import { ArrowLeft } from 'lucide-react'

export default function SavedPage() {
  const router = useRouter()
  const { investor, loading: userLoading } = useUser()
  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSaved = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!investor) {
      setStartups([])
      setLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { data: savedRows, error: savedError } = await supabase
        .from('saved_startups')
        .select('startup_id')
        .eq('investor_id', investor.id)

      if (savedError) throw savedError

      const ids = (savedRows ?? []).map((row: { startup_id: string }) => row.startup_id)

      if (ids.length === 0) {
        setStartups([])
        setLoading(false)
        return
      }

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
  }, [investor])

  useEffect(() => {
    void fetchSaved()
  }, [fetchSaved])

  const handleRemove = async (id: string) => {
    if (!investor) return
    const supabase = createClient()
    const { error: deleteError } = await supabase
      .from('saved_startups')
      .delete()
      .eq('investor_id', investor.id)
      .eq('startup_id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }

    setStartups((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-28 sm:px-6">
      <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />
      <button
        type="button"
        onClick={() => router.push('/browse')}
        className="mb-6 flex items-center gap-1.5 text-[13px] text-ink/60 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to browse
      </button>
      <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-blue-accent">Investor space</p>
      <h1 className="mt-4 font-serif text-[clamp(2.7rem,6vw,4rem)] font-semibold tracking-[-.04em] text-ink">Saved startups</h1>
      <p className="mt-3 text-[15px] font-normal text-ink/60">Startups you bookmarked for a closer look.</p>

      {(loading || userLoading) && <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="shimmer h-64 rounded-card" />)}</div>}
      {error && <p className="mt-8 rounded-xl border border-red-700/20 bg-red-50 px-4 py-3 text-red-700">{error}</p>}

      {!loading && !userLoading && startups.length === 0 && (
        <Card className="mt-10 py-12 text-center sm:py-16">
          <p className="font-serif text-3xl font-semibold tracking-[-.035em] text-ink">No saved startups yet</p>
          <p className="mt-3 text-sm font-normal text-ink/60">Save a startup from the marketplace to return to it here.</p>
          <Link href="/browse" className="mt-6 inline-block">
            <Button>Browse startups</Button>
          </Link>
        </Card>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {startups.map((startup) => (
          <div key={startup.id} className="relative">
            <StartupCard startup={startup} href={`/startup/${startup.id}`} />
            <button
              type="button"
              onClick={() => void handleRemove(startup.id)}
              className="mt-3 text-sm font-semibold text-red-700 hover:underline"
            >
              Remove from saved
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
