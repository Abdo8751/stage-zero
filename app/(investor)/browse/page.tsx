'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getSavedStartupIds, toggleSavedStartup } from '@/lib/auth'
import { StartupCard } from '@/components/StartupCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { Startup, StartupStage } from '@/lib/types'
import { SECTORS, STARTUP_STAGES } from '@/lib/types'

const PICKS: Startup[] = [
  {
    id: 'pick-1',
    user_id: '',
    name: 'NilePay',
    tagline: 'Mobile payments for Egypt\'s informal economy',
    sector: ['Fintech'],
    stage: 'seed',
    problem: null,
    solution: null,
    raise_amount: 2_500_000,
    pitch_deck_url: null,
    website_url: null,
    traction: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'pick-2',
    user_id: '',
    name: 'HarvestIQ',
    tagline: 'AI crop monitoring for smallholder farms',
    sector: ['Agtech'],
    stage: 'pre_seed',
    problem: null,
    solution: null,
    raise_amount: 800_000,
    pitch_deck_url: null,
    website_url: null,
    traction: null,
    is_active: true,
    created_at: new Date().toISOString(),
  },
]

export default function BrowsePage() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [stageFilter, setStageFilter] = useState<StartupStage | ''>('')
  const [minRaise, setMinRaise] = useState('')
  const [maxRaise, setMaxRaise] = useState('')
  const [savedIds, setSavedIds] = useState<string[]>([])

  const fetchStartups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      let query = supabase
        .from('startups')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (stageFilter) query = query.eq('stage', stageFilter)

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      let filtered = (data ?? []) as Startup[]

      if (search.trim()) {
        const q = search.toLowerCase()
        filtered = filtered.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            (s.tagline?.toLowerCase().includes(q) ?? false)
        )
      }

      if (sectorFilter) {
        filtered = filtered.filter((s) => s.sector.includes(sectorFilter))
      }

      if (minRaise) {
        filtered = filtered.filter((s) => (s.raise_amount ?? 0) >= parseInt(minRaise, 10))
      }
      if (maxRaise) {
        filtered = filtered.filter((s) => (s.raise_amount ?? 0) <= parseInt(maxRaise, 10))
      }

      setStartups(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load startups')
    } finally {
      setLoading(false)
    }
  }, [search, sectorFilter, stageFilter, minRaise, maxRaise])

  useEffect(() => {
    setSavedIds(getSavedStartupIds())
    void fetchStartups()
  }, [fetchStartups])

  const handleSave = (id: string) => {
    setSavedIds(toggleSavedStartup(id))
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="text-3xl sm:text-4xl">Browse startups</h1>
      <p className="mt-2 text-muted">Discover Egypt&apos;s next generation of founders</p>

      <section className="mt-8">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl">Stage Zero Picks</h2>
          <Badge variant="gold">Curated</Badge>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PICKS.map((s) => (
            <StartupCard key={s.id} startup={s} href={`/startup/${s.id}`} />
          ))}
        </div>
      </section>

      <Card className="mt-8 space-y-4">
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Keyword search…"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm text-navy">Sector</label>
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full border border-muted/40 bg-white/60 px-3 py-2 text-sm"
            >
              <option value="">All sectors</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm text-navy">Stage</label>
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value as StartupStage | '')}
              className="w-full border border-muted/40 bg-white/60 px-3 py-2 text-sm"
            >
              <option value="">All stages</option>
              {STARTUP_STAGES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Min raise (EGP)"
            type="number"
            value={minRaise}
            onChange={(e) => setMinRaise(e.target.value)}
          />
          <Input
            label="Max raise (EGP)"
            type="number"
            value={maxRaise}
            onChange={(e) => setMaxRaise(e.target.value)}
          />
        </div>
      </Card>

      {loading && <p className="mt-8 text-muted">Loading startups…</p>}
      {error && <p className="mt-8 text-red-600">{error}</p>}

      {!loading && startups.length === 0 && (
        <div className="mt-12 text-center text-muted">
          <p>No startups match your filters.</p>
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {startups.map((startup) => (
          <StartupCard
            key={startup.id}
            startup={startup}
            href={`/startup/${startup.id}`}
            showSave
            isSaved={savedIds.includes(startup.id)}
            onSave={() => handleSave(startup.id)}
          />
        ))}
      </div>
    </div>
  )
}
