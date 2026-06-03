'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { StartupCard } from '@/components/StartupCard'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import type { Startup, StartupStage } from '@/lib/types'
import { SECTORS, STARTUP_STAGES } from '@/lib/types'
import { Search } from 'lucide-react'

export default function BrowsePage() {
  const { investor } = useUser()
  const [startups, setStartups]       = useState<Startup[]>([])
  const [featured, setFeatured]       = useState<Startup[]>([])
  const [savedIds, setSavedIds]       = useState<Set<string>>(new Set())
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [stageFilter, setStageFilter]   = useState<StartupStage | ''>('')
  const [minRaise, setMinRaise]       = useState('')
  const [maxRaise, setMaxRaise]       = useState('')

  /* Load saved startup IDs from DB */
  const loadSaved = useCallback(async () => {
    if (!investor) return
    const supabase = createClient()
    const { data } = await supabase
      .from('saved_startups')
      .select('startup_id')
      .eq('investor_id', investor.id)
    setSavedIds(new Set((data ?? []).map((r: any) => r.startup_id as string)))
  }, [investor])

  const fetchStartups = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      // Only show status='active' AND is_active=true
      let query = supabase
        .from('startups')
        .select('*')
        .eq('status', 'active')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (stageFilter)  query = query.eq('stage', stageFilter)
      if (minRaise)     query = query.gte('raise_amount', parseInt(minRaise, 10))
      if (maxRaise)     query = query.lte('raise_amount', parseInt(maxRaise, 10))

      const { data, error: fetchError } = await query
      if (fetchError) throw fetchError

      let all = (data ?? []) as Startup[]

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

  useEffect(() => { void fetchStartups() }, [fetchStartups])
  useEffect(() => { void loadSaved() },    [loadSaved])

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
        <h1 className="text-[36px] font-black tracking-tightest text-cream sm:text-[44px]">Browse startups</h1>
        <p className="mt-2 text-[14px] text-cream-muted">Discover Egypt&apos;s next generation of founders.</p>
      </div>

      {/* Stage Zero Picks */}
      {featured.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-[18px] font-black tracking-tight text-cream">Stage Zero Picks</h2>
            <Badge variant="gold">Curated</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((s) => (
              <StartupCard
                key={s.id}
                startup={s}
                href={`/startup/${s.id}`}
                showSave
                isSaved={savedIds.has(s.id)}
                onSave={() => handleSave(s.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <Card className="mb-8 space-y-4">
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name, tagline, problem, solution..."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">Sector</label>
            <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}
              className="w-full bg-[rgba(4,11,26,0.6)] border border-glass-border rounded-input px-4 py-3 text-[14px] text-cream focus:border-[rgba(75,124,246,0.5)] focus:outline-none [&>option]:bg-navy cursor-pointer">
              <option value="">All sectors</option>
              {SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">Stage</label>
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as StartupStage | '')}
              className="w-full bg-[rgba(4,11,26,0.6)] border border-glass-border rounded-input px-4 py-3 text-[14px] text-cream focus:border-[rgba(75,124,246,0.5)] focus:outline-none [&>option]:bg-navy cursor-pointer">
              <option value="">All stages</option>
              {STARTUP_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <Input label="Min raise (EGP)" type="number" value={minRaise} onChange={(e) => setMinRaise(e.target.value)} placeholder="0" />
          <Input label="Max raise (EGP)" type="number" value={maxRaise} onChange={(e) => setMaxRaise(e.target.value)} placeholder="Any" />
        </div>
      </Card>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="shimmer h-60 rounded-card" />)}
        </div>
      )}
      {error && <p className="text-[#FF453A]">{error}</p>}

      {!loading && startups.length === 0 && !error && (
        <Card className="py-12 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-cream-subtle" />
          <p className="text-[15px] font-bold text-cream">No startups match your filters</p>
          <p className="mt-1 text-[13px] text-cream-muted">Try adjusting your search or clearing filters.</p>
        </Card>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {startups.map((startup) => (
          <StartupCard
            key={startup.id}
            startup={startup}
            href={`/startup/${startup.id}`}
            showSave
            isSaved={savedIds.has(startup.id)}
            onSave={() => handleSave(startup.id)}
          />
        ))}
      </div>
    </div>
  )
}
