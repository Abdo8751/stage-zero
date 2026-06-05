'use client'

import { useCallback, useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { StartupCard } from '@/components/StartupCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { Startup, StartupStage } from '@/lib/types'
import { SECTORS, STARTUP_STAGES } from '@/lib/types'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function BrowsePage() {
  const { investor } = useUser()
  const [startups, setStartups]         = useState<Startup[]>([])
  const [featured, setFeatured]         = useState<Startup[]>([])
  const [savedIds, setSavedIds]         = useState<Set<string>>(new Set())
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [search, setSearch]             = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [stageFilter, setStageFilter]   = useState<StartupStage | ''>('')
  const [minRaise, setMinRaise]         = useState('')
  const [maxRaise, setMaxRaise]         = useState('')

  const loadSaved = useCallback(async () => {
    if (!investor) return
    const supabase = createClient()
    const { data } = await supabase
      .from('saved_startups')
      .select('startup_id')
      .eq('investor_id', investor.id)
    setSavedIds(new Set((data ?? []).map((r: { startup_id: string }) => r.startup_id)))
  }, [investor])

  const fetchStartups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (stageFilter) params.set('stage', stageFilter)
      if (minRaise)    params.set('minRaise', minRaise)
      if (maxRaise)    params.set('maxRaise', maxRaise)

      // Use service-role API so RLS never blocks investor browse
      const res = await fetch(`/api/startups?${params.toString()}`)
      const json = await res.json() as { data?: Startup[]; error?: string }

      if (!res.ok || json.error) throw new Error(json.error ?? 'Failed to load')

      let all = json.data ?? []

      if (search.trim()) {
        const q = search.toLowerCase()
        all = all.filter((s) =>
          s.name.toLowerCase().includes(q) ||
          (s.tagline?.toLowerCase().includes(q) ?? false) ||
          (s.problem?.toLowerCase().includes(q) ?? false) ||
          (s.solution?.toLowerCase().includes(q) ?? false),
        )
      }

      if (sectorFilter) {
        all = all.filter((s) => s.sector.includes(sectorFilter))
      }

      setFeatured(all.filter((s) => s.is_featured))
      setStartups(all.filter((s) => !s.is_featured))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load startups')
    } finally {
      setLoading(false)
    }
  }, [search, sectorFilter, stageFilter, minRaise, maxRaise])

  // On first mount: activate any pending startups, THEN fetch so they appear immediately
  useEffect(() => {
    const init = async () => {
      await fetch('/api/startups/activate-pending', { method: 'POST' }).catch(() => {})
      void fetchStartups()
    }
    void init()
    void loadSaved()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-fetch when filters change (skips the activate step, already done above)
  useEffect(() => {
    void fetchStartups()
  }, [fetchStartups])

  const handleSave = async (startupId: string) => {
    if (!investor) return
    const supabase = createClient()
    if (savedIds.has(startupId)) {
      await supabase.from('saved_startups').delete()
        .eq('investor_id', investor.id).eq('startup_id', startupId)
      setSavedIds((prev) => { const n = new Set(prev); n.delete(startupId); return n })
    } else {
      await supabase.from('saved_startups').insert({ investor_id: investor.id, startup_id: startupId })
      setSavedIds((prev) => new Set(prev).add(startupId))
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-16 sm:px-6">
      <div className="mb-8">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.14em] text-cream-muted">Marketplace</p>
        <h1 className="text-[32px] font-black tracking-tightest text-cream sm:text-[44px]">Browse startups</h1>
        <p className="mt-2 text-[14px] text-cream-muted">Discover Egypt&apos;s next generation of founders.</p>
      </div>

      {featured.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-[18px] font-black tracking-tight text-cream">Stage Zero Picks</h2>
            <Badge variant="gold">Curated</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((s) => (
              <StartupCard key={s.id} startup={s} href={`/startup/${s.id}`}
                showSave isSaved={savedIds.has(s.id)} onSave={() => handleSave(s.id)} />
            ))}
          </div>
        </section>
      )}

      <Card className="mb-8 space-y-4">
        <Input label="Search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, tagline, problem, solution..." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">Sector</label>
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full bg-[rgba(240,228,200,0.07)] border border-[rgba(240,230,208,0.18)] rounded-input px-4 py-3 text-[14px] text-cream focus:border-[rgba(240,230,208,0.50)] focus:outline-none [&>option]:bg-navy cursor-pointer">
              <option value="">All sectors</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">Stage</label>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as StartupStage | '')}
              className="w-full bg-[rgba(240,228,200,0.07)] border border-[rgba(240,230,208,0.18)] rounded-input px-4 py-3 text-[14px] text-cream focus:border-[rgba(240,230,208,0.50)] focus:outline-none [&>option]:bg-navy cursor-pointer">
              <option value="">All stages</option>
              {STARTUP_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <Input label="Min raise (EGP)" type="number" value={minRaise}
            onChange={(e) => setMinRaise(e.target.value)} placeholder="0" />
          <Input label="Max raise (EGP)" type="number" value={maxRaise}
            onChange={(e) => setMaxRaise(e.target.value)} placeholder="Any" />
        </div>
      </Card>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="shimmer h-60 rounded-card" />)}
        </div>
      )}
      {error && <p className="text-[#FF453A] text-[13px]">{error}</p>}

      {!loading && startups.length === 0 && !error && (
        <Card className="py-12 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-cream-subtle" />
          <p className="text-[15px] font-bold text-cream">No startups match your filters</p>
          <p className="mt-1 text-[13px] text-cream-muted">Try adjusting your search or clearing filters.</p>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {startups.map((startup) => (
          <StartupCard key={startup.id} startup={startup} href={`/startup/${startup.id}`}
            showSave isSaved={savedIds.has(startup.id)} onSave={() => handleSave(startup.id)} />
        ))}
      </div>
    </div>
  )
}

