'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Lock, TrendingUp, Search, ArrowRight, MapPin, Globe } from 'lucide-react'
import { STARTUP_STAGES, type Startup, type StartupStage } from '@/lib/types'

function stageLabel(stage: string) {
  return STARTUP_STAGES.find((s) => s.value === stage)?.label ?? stage
}

function formatRaise(amount: number) {
  if (amount >= 1_000_000) return `EGP ${(amount / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
  return `EGP ${(amount / 1_000).toFixed(0)}K`
}

function GateOverlay() {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-10 bg-[rgba(4,11,26,0.55)] backdrop-blur-[2px] rounded-card">
      <div className="flex items-center gap-1.5 rounded-full border border-[rgba(240,230,208,0.14)] bg-[rgba(4,11,26,0.88)] px-3 py-1.5">
        <Lock className="h-3 w-3 text-cream-subtle" />
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cream-subtle">Investor access only</span>
      </div>
    </div>
  )
}

function StartupCard({
  startup,
  isInvestor,
}: {
  startup: Startup
  isInvestor: boolean
}) {
  const raise = startup.raise_amount ? formatRaise(startup.raise_amount) : null

  return (
    <div className="relative animate-scale-in">
      <Card hoverable={isInvestor} className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[rgba(75,124,246,0.14)] border border-[rgba(75,124,246,0.25)] text-blue-bright font-black text-[17px]">
            {startup.name[0]}
          </div>
          <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
        </div>

        {/* Name + tagline */}
        <div className="mt-4 flex-1">
          <h2 className="text-[16px] font-black tracking-tight text-cream leading-snug">{startup.name}</h2>
          {startup.tagline && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-cream-muted">{startup.tagline}</p>
          )}
        </div>

        {/* Sectors */}
        {startup.sector?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {startup.sector.map((s) => <Badge key={s} variant="muted">{s}</Badge>)}
          </div>
        )}

        {/* Meta */}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-[rgba(240,230,208,0.06)] pt-4">
          {raise && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-amber shrink-0" />
              <span className="text-[12px] font-bold text-amber">{raise}</span>
            </div>
          )}
          {startup.website_url && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-cream-subtle shrink-0" />
              <span className="text-[12px] text-cream-subtle truncate max-w-[120px]">{startup.website_url.replace(/^https?:\/\//, '')}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-3">
          {isInvestor ? (
            <Link
              href={`/startup/${startup.id}`}
              className="flex items-center justify-between rounded-[10px] border border-[rgba(75,124,246,0.25)] bg-[rgba(75,124,246,0.08)] px-3 py-2.5 hover:bg-[rgba(75,124,246,0.14)] transition-colors"
            >
              <span className="text-[12px] font-semibold text-blue-bright">View full profile</span>
              <ArrowRight className="h-3.5 w-3.5 text-blue-bright" />
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-1.5 rounded-[10px] border border-[rgba(240,230,208,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5">
              <Lock className="h-3 w-3 text-cream-subtle" />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cream-subtle">Investor access only</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

const ALL_STAGES = STARTUP_STAGES.map((s) => s.value)

export default function ExplorePage() {
  const { user } = useUser()
  const isInvestor = user?.role === 'investor'

  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [stageFilter, setStageFilter]   = useState<StartupStage | ''>('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        // Activate any pending completed startups first (silent, server-side)
        await fetch('/api/startups/activate-pending', { method: 'POST' }).catch(() => {})
        const res = await fetch('/api/startups')
        const json = await res.json() as { data?: Startup[] }
        setStartups(json.data ?? [])
      } catch {
        setStartups([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  // Derive unique sectors from real data
  const allSectors = Array.from(new Set(startups.flatMap((s) => s.sector ?? [])))

  const filtered = startups.filter((s) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || (s.tagline?.toLowerCase().includes(q) ?? false)
    const matchesSector = !sectorFilter || (s.sector ?? []).includes(sectorFilter)
    const matchesStage  = !stageFilter  || s.stage === stageFilter
    return matchesSearch && matchesSector && matchesStage
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-20 pb-16 sm:px-6">

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-cream-muted">Marketplace</p>
          <h1 className="text-[30px] font-black tracking-tightest text-cream sm:text-[40px]">
            What&apos;s building in Egypt
          </h1>
          <p className="mt-2 max-w-md text-[13px] leading-relaxed text-cream-muted">
            {isInvestor
              ? 'Click any card to view the full profile and express interest.'
              : 'Discover Egyptian startups raising right now. Full profiles available to verified investors.'}
          </p>
        </div>
        {!isInvestor && (
          <Link href="/signup?role=investor" className="shrink-0">
            <Button size="sm">
              Get full access <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream-subtle" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search startups…"
            className="w-full bg-[rgba(4,11,26,0.7)] border border-[rgba(255,255,255,0.10)] rounded-[10px] pl-9 pr-4 py-2.5 text-[13px] text-cream placeholder:text-cream-subtle focus:border-[rgba(75,124,246,0.45)] focus:outline-none transition-colors"
          />
        </div>
        {allSectors.length > 0 && (
          <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-[rgba(4,11,26,0.80)] border border-[rgba(255,255,255,0.10)] rounded-[10px] px-3 py-2.5 text-[13px] text-cream focus:border-[rgba(75,124,246,0.45)] focus:outline-none transition-colors cursor-pointer [&>option]:bg-[#070F24] sm:w-36">
            <option value="">All sectors</option>
            {allSectors.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value as StartupStage | '')}
          className="bg-[rgba(4,11,26,0.80)] border border-[rgba(255,255,255,0.10)] rounded-[10px] px-3 py-2.5 text-[13px] text-cream focus:border-[rgba(75,124,246,0.45)] focus:outline-none transition-colors cursor-pointer [&>option]:bg-[#070F24] sm:w-32">
          <option value="">All stages</option>
          {STARTUP_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      <p className="mb-5 text-[12px] text-cream-subtle">
        {loading ? 'Loading…' : `${filtered.length} startup${filtered.length !== 1 ? 's' : ''}`}
      </p>

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="shimmer h-56 rounded-card" />)}
        </div>
      )}

      {/* No results */}
      {!loading && filtered.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-center">
          <Search className="mb-3 h-7 w-7 text-cream-subtle" />
          <p className="text-[15px] font-bold text-cream">
            {startups.length === 0 ? 'No startups listed yet' : 'No startups match your filters'}
          </p>
          <p className="mt-1 text-[13px] text-cream-muted">
            {startups.length === 0
              ? 'Be the first to list your startup.'
              : 'Try adjusting your search or clearing filters.'}
          </p>
          {startups.length === 0 && (
            <Link href="/signup?role=founder" className="mt-4">
              <Button size="sm">List your startup <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((startup) => (
            <StartupCard key={startup.id} startup={startup} isInvestor={isInvestor} />
          ))}
        </div>
      )}

      {/* Investor CTA for non-investors */}
      {!isInvestor && !loading && filtered.length > 0 && (
        <div className="mt-10 glass-card flex flex-col items-center justify-between gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[15px] font-bold text-cream">Want to connect with these founders?</p>
            <p className="mt-0.5 text-[13px] text-cream-muted">
              Verified investors get full profile access, pitch decks, and direct messaging.
            </p>
          </div>
          <Link href="/signup?role=investor" className="shrink-0">
            <Button size="sm">Apply as investor <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Button>
          </Link>
        </div>
      )}
    </div>
  )
}
