'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  Bookmark,
  Coins,
  FilterX,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { StartupCard } from '@/components/StartupCard'
import type { Startup, StartupStage } from '@/lib/types'
import { SECTORS, STARTUP_STAGES } from '@/lib/types'
import { createClient } from '@/lib/supabase'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[20px] border border-ink/10 bg-paper p-5">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-ink/[.08]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 rounded-full bg-ink/[.08]" />
          <div className="h-3 w-1/3 rounded-full bg-ink/[.06]" />
        </div>
        <div className="h-9 w-9 rounded-full bg-ink/[.06]" />
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full rounded-full bg-ink/[.07]" />
        <div className="h-3 w-5/6 rounded-full bg-ink/[.05]" />
      </div>
      <div className="mt-6 h-10 rounded-full bg-ink/[.07]" />
    </div>
  )
}

function FilterChip({
  children,
  onRemove,
}: {
  children: ReactNode
  onRemove: () => void
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex items-center gap-1.5 rounded-full border border-blue-accent/25 bg-blue-accent/[.08] px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[.08em] text-blue-accent transition-colors hover:border-blue-accent/50"
    >
      {children}
      <span aria-hidden="true">×</span>
    </button>
  )
}

export default function BrowsePage() {
  const { user, investor } = useUser()
  const [allStartups, setAllStartups] = useState<Startup[]>([])
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [stageFilter, setStageFilter] = useState<StartupStage | ''>('')
  const [minRaise, setMinRaise] = useState('')
  const [maxRaise, setMaxRaise] = useState('')

  const isInvestor = user?.role === 'investor' && Boolean(investor)

  const loadSaved = useCallback(async () => {
    if (!investor) {
      setSavedIds(new Set())
      return
    }

    const supabase = createClient()
    const { data, error: savedError } = await supabase
      .from('saved_startups')
      .select('startup_id')
      .eq('investor_id', investor.id)

    if (savedError) {
      setError('Unable to load saved startups')
      return
    }

    setSavedIds(new Set((data ?? []).map((row: { startup_id: string }) => row.startup_id)))
  }, [investor])

  const fetchStartups = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (stageFilter) params.set('stage', stageFilter)
      if (minRaise) params.set('minRaise', minRaise)
      if (maxRaise) params.set('maxRaise', maxRaise)

      const response = await fetch(`/api/startups?${params.toString()}`)
      const result = await response.json() as { data?: Startup[]; error?: string }
      if (!response.ok || result.error) throw new Error(result.error ?? 'Failed to load startups')

      setAllStartups(result.data ?? [])
    } catch (fetchError) {
      setAllStartups([])
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load startups')
    } finally {
      setLoading(false)
    }
  }, [stageFilter, minRaise, maxRaise])

  useEffect(() => {
    void fetchStartups()
  }, [fetchStartups])

  useEffect(() => {
    void loadSaved()
  }, [loadSaved])

  const filteredStartups = useMemo(() => {
    const query = search.trim().toLowerCase()
    return allStartups.filter((startup) => {
      const matchesSearch =
        !query ||
        startup.name.toLowerCase().includes(query) ||
        (startup.tagline?.toLowerCase().includes(query) ?? false) ||
        (startup.problem?.toLowerCase().includes(query) ?? false) ||
        (startup.solution?.toLowerCase().includes(query) ?? false)
      const matchesSector = !sectorFilter || startup.sector.includes(sectorFilter)
      return matchesSearch && matchesSector
    })
  }, [allStartups, search, sectorFilter])

  const featured = filteredStartups.filter((startup) => startup.is_featured)
  const startups = filteredStartups.filter((startup) => !startup.is_featured)
  const isFiltered = Boolean(search || sectorFilter || stageFilter || minRaise || maxRaise)

  const clearFilters = () => {
    setSearch('')
    setSectorFilter('')
    setStageFilter('')
    setMinRaise('')
    setMaxRaise('')
  }

  const handleSave = async (startupId: string) => {
    if (!investor) return

    const wasSaved = savedIds.has(startupId)
    setSavedIds((current) => {
      const next = new Set(current)
      if (wasSaved) next.delete(startupId)
      else next.add(startupId)
      return next
    })

    const supabase = createClient()
    const { error: saveError } = wasSaved
      ? await supabase
          .from('saved_startups')
          .delete()
          .eq('investor_id', investor.id)
          .eq('startup_id', startupId)
      : await supabase
          .from('saved_startups')
          .insert({ investor_id: investor.id, startup_id: startupId })

    if (saveError) {
      setSavedIds((current) => {
        const next = new Set(current)
        if (wasSaved) next.add(startupId)
        else next.delete(startupId)
        return next
      })
      setError('Unable to update saved startups')
    }
  }

  return (
    <div className="relative min-h-screen bg-parchment pb-16 pt-[76px] text-ink">
      <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />

      <div className="border-b border-ink/10 bg-paper/75">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-5 py-5 sm:px-8 lg:px-10">
          <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-ink/40">
              {isInvestor ? 'Investor workspace' : 'Startup marketplace'}
            </p>
            <h1 className="mt-2 font-serif text-[clamp(2rem,5vw,3.25rem)] font-semibold tracking-[-.04em] text-ink">
              Browse startups
            </h1>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-0 xl:grid-cols-[minmax(0,1fr)_260px]">
        <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10">
          <div className="mb-7 overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-[0_4px_20px_rgba(8,10,20,.05)]">
            <div className="flex flex-col gap-3 p-4 lg:flex-row">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Search startups</span>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/35" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, description, problem, or solution…"
                  className="w-full rounded-xl border border-ink/15 bg-warm-cream/70 py-3 pl-10 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-blue-accent focus:ring-2 focus:ring-blue-accent/20"
                />
              </label>

              <label>
                <span className="sr-only">Filter by sector</span>
                <select
                  value={sectorFilter}
                  onChange={(event) => setSectorFilter(event.target.value)}
                  className="w-full cursor-pointer rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink/70 outline-none focus:border-blue-accent lg:w-40"
                >
                  <option value="">All sectors</option>
                  {SECTORS.map((sector) => <option key={sector} value={sector}>{sector}</option>)}
                </select>
              </label>

              <label>
                <span className="sr-only">Filter by funding stage</span>
                <select
                  value={stageFilter}
                  onChange={(event) => setStageFilter(event.target.value as StartupStage | '')}
                  className="w-full cursor-pointer rounded-xl border border-ink/15 bg-paper px-4 py-3 text-sm text-ink/70 outline-none focus:border-blue-accent lg:w-36"
                >
                  <option value="">All stages</option>
                  {STARTUP_STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}
                </select>
              </label>
            </div>

            <div className="grid gap-3 border-t border-ink/10 bg-warm-cream/30 p-4 sm:grid-cols-2">
              <label className="flex items-center gap-3">
                <span className="w-24 shrink-0 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-ink/40">Min raise</span>
                <input
                  type="number"
                  min="0"
                  value={minRaise}
                  onChange={(event) => setMinRaise(event.target.value)}
                  placeholder="No minimum"
                  className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-blue-accent"
                />
              </label>
              <label className="flex items-center gap-3">
                <span className="w-24 shrink-0 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-ink/40">Max raise</span>
                <input
                  type="number"
                  min="0"
                  value={maxRaise}
                  onChange={(event) => setMaxRaise(event.target.value)}
                  placeholder="No maximum"
                  className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-blue-accent"
                />
              </label>
            </div>

            {isFiltered && (
              <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 px-4 py-3">
                <span className="mr-1 flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-ink/35">
                  <SlidersHorizontal className="h-3 w-3" />
                  Active filters
                </span>
                {search && <FilterChip onRemove={() => setSearch('')}>“{search}”</FilterChip>}
                {sectorFilter && <FilterChip onRemove={() => setSectorFilter('')}>{sectorFilter}</FilterChip>}
                {stageFilter && (
                  <FilterChip onRemove={() => setStageFilter('')}>
                    {STARTUP_STAGES.find((stage) => stage.value === stageFilter)?.label}
                  </FilterChip>
                )}
                {minRaise && <FilterChip onRemove={() => setMinRaise('')}>From EGP {Number(minRaise).toLocaleString()}</FilterChip>}
                {maxRaise && <FilterChip onRemove={() => setMaxRaise('')}>To EGP {Number(maxRaise).toLocaleString()}</FilterChip>}
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-ink/45 transition-colors hover:text-ink"
                >
                  <FilterX className="h-3.5 w-3.5" />
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[.14em] text-blue-accent">Marketplace</p>
              <p className="mt-1 text-sm text-ink/50" aria-live="polite">
                {loading
                  ? 'Loading companies…'
                  : `${filteredStartups.length} ${filteredStartups.length === 1 ? 'company' : 'companies'}`}
              </p>
            </div>
            <Link
              href="/saved"
              className={`items-center gap-1.5 text-[12px] font-semibold text-ink/50 transition-colors hover:text-blue-accent ${
                isInvestor ? 'hidden sm:flex' : 'hidden'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              View saved
            </Link>
          </div>

          {loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-700/20 bg-red-50 px-6 py-12 text-center">
              <p className="font-serif text-2xl text-red-800">Unable to load the marketplace.</p>
              <p className="mt-2 text-sm text-red-700/75">{error}</p>
              <button
                type="button"
                onClick={() => void fetchStartups()}
                className="mt-6 rounded-full border border-red-700/25 bg-paper px-5 py-2.5 text-sm font-semibold text-red-800 transition-colors hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredStartups.length === 0 && (
            <div className="rounded-2xl border border-ink/10 bg-paper px-6 py-16 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-ink/10 bg-warm-cream text-amber">
                <Search className="h-6 w-6" />
              </span>
              <p className="mt-5 font-serif text-3xl font-semibold tracking-[-.035em] text-ink">
                No startups match your filters
              </p>
              <p className="mt-3 text-sm text-ink/55">Try a broader search or clear the active filters.</p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 rounded-full bg-blue-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-bright"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {!loading && !error && featured.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-center gap-3">
                <h2 className="font-serif text-[30px] font-semibold tracking-[-.035em] text-ink">Stage Zero Picks</h2>
                <span className="rounded-full border border-amber/30 bg-amber/10 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-[#9A6200]">
                  Curated
                </span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((startup) => (
                  <StartupCard
                    key={startup.id}
                    startup={startup}
                    href={`/startup/${startup.id}`}
                    showSave={isInvestor}
                    isSaved={savedIds.has(startup.id)}
                    onSave={() => void handleSave(startup.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {!loading && !error && startups.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {startups.map((startup) => (
                <StartupCard
                  key={startup.id}
                  startup={startup}
                  href={`/startup/${startup.id}`}
                  showSave={isInvestor}
                  isSaved={savedIds.has(startup.id)}
                  onSave={() => void handleSave(startup.id)}
                />
              ))}
            </div>
          )}
        </main>

        <aside className="hidden border-l border-ink/10 px-5 py-8 xl:block">
          {isInvestor ? (
            <div className="rounded-2xl border border-ink/10 bg-paper p-5">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-ink/40">
                  Interest credits
                </p>
                <Coins className="h-4 w-4 text-amber" />
              </div>
              <p className="mt-4 font-serif text-4xl font-semibold tracking-[-.04em] text-ink">
                {investor?.credits ?? 0}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-ink/50">Available introductions</p>
              <Link
                href="/upgrade"
                className="mt-4 inline-flex text-[12px] font-semibold text-blue-accent hover:text-blue-bright"
              >
                Manage credits
              </Link>
            </div>
          ) : (
            <div className="rounded-2xl border border-ink/10 bg-paper p-5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-ink/40">Founder view</p>
              <p className="mt-3 text-[12px] leading-5 text-ink/55">
                You can review active startup profiles. Investor-only actions remain unavailable.
              </p>
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-ink/10 bg-paper p-5">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-ink/40">How Browse works</p>
            <ol className="mt-4 space-y-3 text-[12px] leading-5 text-ink/55">
              <li><strong className="text-ink/75">01.</strong> Narrow the marketplace by sector, stage, or raise.</li>
              <li><strong className="text-ink/75">02.</strong> Open a full profile to review its existing company context.</li>
              {isInvestor && (
                <>
                  <li><strong className="text-ink/75">03.</strong> Save companies you want to revisit.</li>
                  <li><strong className="text-ink/75">04.</strong> Express interest from the full startup profile.</li>
                </>
              )}
            </ol>
          </div>

          <div className="mt-4 rounded-2xl bg-amber/[.15] p-5">
            <p className="font-mono text-[9px] font-bold uppercase tracking-[.12em] text-[#9A6200]">Private by design</p>
            <p className="mt-2 text-[12px] leading-5 text-ink/60">
              Complete company context stays inside the authenticated Stage Zero workspace.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
