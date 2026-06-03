'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Lock, TrendingUp, Search, ArrowRight, MapPin, Users, Globe } from 'lucide-react'
import { STARTUP_STAGES, type StartupStage } from '@/lib/types'

/* ── Dummy startup data ───────────────────────────────────── */
const DUMMY_STARTUPS = [
  {
    id: 'd-1',
    name: 'NilePay',
    initial: 'N',
    tagline: 'Mobile payments for Egypt\'s informal economy',
    sector: ['Fintech', 'Mobile'],
    stage: 'seed' as StartupStage,
    raise_amount: 2_500_000,
    city: 'Cairo',
    team_size: 12,
    traction: '38K active wallets · EGP 9M processed monthly',
    website: 'nilepay.io',
    email_hint: 'ma●●●@nilepay.io',
    phone_hint: '+20 100 ●●● ●●●●',
    color: 'from-[rgba(75,124,246,0.25)] to-[rgba(75,124,246,0.05)]',
    border: 'rgba(75,124,246,0.30)',
  },
  {
    id: 'd-2',
    name: 'HarvestIQ',
    initial: 'H',
    tagline: 'AI-powered crop monitoring for smallholder farms',
    sector: ['Agtech', 'AI / ML'],
    stage: 'pre_seed' as StartupStage,
    raise_amount: 800_000,
    city: 'Alexandria',
    team_size: 5,
    traction: '200 farms onboarded · 18% yield improvement average',
    website: 'harvestiq.farm',
    email_hint: 'ah●●●@harvestiq.farm',
    phone_hint: '+20 111 ●●● ●●●●',
    color: 'from-[rgba(52,199,89,0.20)] to-[rgba(52,199,89,0.04)]',
    border: 'rgba(52,199,89,0.28)',
  },
  {
    id: 'd-3',
    name: 'MedBridge',
    initial: 'M',
    tagline: 'Connecting rural clinics to specialist care via telemedicine',
    sector: ['Healthtech'],
    stage: 'series_a' as StartupStage,
    raise_amount: 12_000_000,
    city: 'Cairo',
    team_size: 34,
    traction: '420 clinics · 1,200 monthly consultations · MOH partnership',
    website: 'medbridge.eg',
    email_hint: 'om●●●@medbridge.eg',
    phone_hint: '+20 122 ●●● ●●●●',
    color: 'from-[rgba(255,159,10,0.18)] to-[rgba(255,159,10,0.04)]',
    border: 'rgba(255,159,10,0.28)',
  },
  {
    id: 'd-4',
    name: 'Logistly',
    initial: 'L',
    tagline: 'Last-mile delivery infrastructure for Egyptian e-commerce',
    sector: ['Logistics', 'E-commerce'],
    stage: 'seed' as StartupStage,
    raise_amount: 4_000_000,
    city: 'Giza',
    team_size: 21,
    traction: '85 merchant clients · 3,200 daily deliveries · 97% on-time rate',
    website: 'logistly.co',
    email_hint: 'ka●●●@logistly.co',
    phone_hint: '+20 128 ●●● ●●●●',
    color: 'from-[rgba(232,165,60,0.18)] to-[rgba(232,165,60,0.04)]',
    border: 'rgba(232,165,60,0.28)',
  },
  {
    id: 'd-5',
    name: 'ScholarX',
    initial: 'S',
    tagline: 'Adaptive tutoring platform for Egyptian high school students',
    sector: ['Edtech'],
    stage: 'pre_seed' as StartupStage,
    raise_amount: 1_200_000,
    city: 'Cairo',
    team_size: 8,
    traction: '6,000 registered students · 4.8/5 avg rating',
    website: 'scholarx.eg',
    email_hint: 'fe●●●@scholarx.eg',
    phone_hint: '+20 105 ●●● ●●●●',
    color: 'from-[rgba(168,85,247,0.18)] to-[rgba(168,85,247,0.04)]',
    border: 'rgba(168,85,247,0.28)',
  },
  {
    id: 'd-6',
    name: 'PropScan',
    initial: 'P',
    tagline: 'AI property valuation and title verification for Egypt\'s real estate market',
    sector: ['Proptech', 'AI / ML'],
    stage: 'seed' as StartupStage,
    raise_amount: 3_500_000,
    city: 'New Cairo',
    team_size: 14,
    traction: '1,800 properties assessed · partnered with 3 major banks',
    website: 'propscan.io',
    email_hint: 'ya●●●@propscan.io',
    phone_hint: '+20 106 ●●● ●●●●',
    color: 'from-[rgba(236,72,153,0.15)] to-[rgba(236,72,153,0.04)]',
    border: 'rgba(236,72,153,0.28)',
  },
  {
    id: 'd-7',
    name: 'CarbonChain EG',
    initial: 'C',
    tagline: 'Carbon credit marketplace for Egyptian industry',
    sector: ['SaaS', 'Fintech'],
    stage: 'pre_seed' as StartupStage,
    raise_amount: 900_000,
    city: 'Alexandria',
    team_size: 6,
    traction: 'Pilot with 4 factories · 12K tonnes CO₂ tracked',
    website: 'carbonchain.eg',
    email_hint: 'sa●●●@carbonchain.eg',
    phone_hint: '+20 103 ●●● ●●●●',
    color: 'from-[rgba(52,199,89,0.15)] to-[rgba(52,199,89,0.03)]',
    border: 'rgba(52,199,89,0.22)',
  },
  {
    id: 'd-8',
    name: 'Fleck',
    initial: 'F',
    tagline: 'B2B procurement platform reducing costs for Egyptian SMEs',
    sector: ['SaaS', 'E-commerce'],
    stage: 'series_a' as StartupStage,
    raise_amount: 8_000_000,
    city: 'Cairo',
    team_size: 29,
    traction: '310 SME clients · EGP 22M GMV in 2024',
    website: 'fleck.eg',
    email_hint: 'mo●●●@fleck.eg',
    phone_hint: '+20 109 ●●● ●●●●',
    color: 'from-[rgba(75,124,246,0.20)] to-[rgba(75,124,246,0.04)]',
    border: 'rgba(75,124,246,0.25)',
  },
  {
    id: 'd-9',
    name: 'DermAI',
    initial: 'D',
    tagline: 'AI skin diagnosis tool for Egyptian dermatologists and clinics',
    sector: ['Healthtech', 'AI / ML'],
    stage: 'pre_seed' as StartupStage,
    raise_amount: 600_000,
    city: 'Cairo',
    team_size: 4,
    traction: '3 hospital pilots · 91% diagnostic accuracy on test set',
    website: 'dermai.health',
    email_hint: 'na●●●@dermai.health',
    phone_hint: '+20 115 ●●● ●●●●',
    color: 'from-[rgba(255,69,58,0.12)] to-[rgba(255,69,58,0.03)]',
    border: 'rgba(255,69,58,0.22)',
  },
]

const ALL_SECTORS = Array.from(new Set(DUMMY_STARTUPS.flatMap((s) => s.sector)))

function stageLabel(stage: StartupStage) {
  return STARTUP_STAGES.find((s) => s.value === stage)?.label ?? stage
}

function formatRaise(amount: number) {
  if (amount >= 1_000_000) return `EGP ${(amount / 1_000_000).toFixed(1)}M`.replace('.0M', 'M')
  return `EGP ${(amount / 1_000).toFixed(0)}K`
}

function ContactRow({
  emailHint,
  phoneHint,
  isInvestor,
  startupId,
}: {
  emailHint: string
  phoneHint: string
  isInvestor: boolean
  startupId: string
}) {
  if (isInvestor) {
    return (
      <Link
        href={`/startup/${startupId}`}
        className="flex items-center justify-between rounded-[10px] border border-[rgba(75,124,246,0.25)] bg-[rgba(75,124,246,0.08)] px-3 py-2.5 hover:bg-[rgba(75,124,246,0.14)] transition-colors"
      >
        <span className="text-[12px] font-semibold text-blue-bright">View full profile & contact</span>
        <ArrowRight className="h-3.5 w-3.5 text-blue-bright" />
      </Link>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-[10px] border border-[rgba(240,230,208,0.08)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5">
      {/* Blurred hint text */}
      <div className="flex flex-col gap-1 blur-[3px] select-none pointer-events-none">
        <p className="text-[12px] text-cream-muted font-mono">✉ {emailHint}</p>
        <p className="text-[12px] text-cream-muted font-mono">📞 {phoneHint}</p>
      </div>
      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-cream-subtle" />
        <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-cream-subtle">Investor access only</span>
      </div>
    </div>
  )
}

export default function ExplorePage() {
  const { user } = useUser()
  const isInvestor = user?.role === 'investor'

  const [search, setSearch] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [stageFilter, setStageFilter] = useState<StartupStage | ''>('')

  const filtered = DUMMY_STARTUPS.filter((s) => {
    const q = search.toLowerCase()
    const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.tagline.toLowerCase().includes(q)
    const matchesSector = !sectorFilter || s.sector.includes(sectorFilter)
    const matchesStage = !stageFilter || s.stage === stageFilter
    return matchesSearch && matchesSector && matchesStage
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-20 pb-16 sm:px-6">

      {/* Header */}
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-cream-muted">Marketplace</p>
        <h1 className="text-[36px] font-black tracking-tightest text-cream sm:text-[48px]">
          Explore startups
        </h1>
        <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-cream-muted">
          Discover what Egyptian founders are building.
          {isInvestor
            ? ' Click any card to view the full profile and express interest.'
            : ' Full contact details are available to verified investors.'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            placeholder="Search by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={sectorFilter}
          onChange={(e) => setSectorFilter(e.target.value)}
          className="bg-[rgba(4,11,26,0.7)] border border-glass-border rounded-input px-4 py-3 text-[14px] text-cream focus:border-[rgba(75,124,246,0.5)] focus:outline-none transition-all [&>option]:bg-navy cursor-pointer"
        >
          <option value="">All sectors</option>
          {ALL_SECTORS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value as StartupStage | '')}
          className="bg-[rgba(4,11,26,0.7)] border border-glass-border rounded-input px-4 py-3 text-[14px] text-cream focus:border-[rgba(75,124,246,0.5)] focus:outline-none transition-all [&>option]:bg-navy cursor-pointer"
        >
          <option value="">All stages</option>
          {STARTUP_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Count */}
      <p className="mb-6 text-[13px] text-cream-subtle">
        {filtered.length} startup{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-center">
          <Search className="mb-3 h-8 w-8 text-cream-subtle" />
          <p className="text-[16px] font-bold text-cream">No startups match your filters</p>
          <p className="mt-1 text-[13px] text-cream-muted">Try adjusting your search or clearing filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((startup, i) => (
            <div
              key={startup.id}
              className="animate-scale-in"
              style={{ animationDelay: `${(i % 9) * 60}ms` }}
            >
              <Card hoverable className="flex h-full flex-col">

                {/* Card top accent strip */}
                <div
                  className={`absolute inset-x-0 top-0 h-[3px] rounded-t-card bg-gradient-to-r ${startup.color}`}
                  style={{ borderTop: `1px solid ${startup.border}` }}
                />

                {/* Header */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br font-black text-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                    style={{
                      background: `linear-gradient(135deg, ${startup.border.replace(')', ', 0.5)').replace('rgba(', 'rgba(')} 0%, rgba(4,11,26,0.8) 100%)`,
                      borderColor: startup.border,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      color: '#F0E6D0',
                    }}
                  >
                    {startup.initial}
                  </div>
                  <Badge variant="gold">{stageLabel(startup.stage)}</Badge>
                </div>

                {/* Name + tagline */}
                <div className="mt-4 flex-1">
                  <h2 className="text-[17px] font-black tracking-tight text-cream leading-snug">{startup.name}</h2>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-cream-muted">{startup.tagline}</p>
                </div>

                {/* Sectors */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {startup.sector.map((s) => <Badge key={s} variant="muted">{s}</Badge>)}
                </div>

                {/* Meta row */}
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[rgba(240,230,208,0.06)] pt-4">
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-cream-subtle">Raising</p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-amber shrink-0" />
                      <p className="text-[13px] font-bold text-amber truncate">{formatRaise(startup.raise_amount)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-cream-subtle">Team</p>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 text-cream-muted shrink-0" />
                      <p className="text-[13px] font-semibold text-cream-muted">{startup.team_size}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-cream-subtle">City</p>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-cream-muted shrink-0" />
                      <p className="text-[13px] font-semibold text-cream-muted truncate">{startup.city}</p>
                    </div>
                  </div>
                </div>

                {/* Traction */}
                {startup.traction && (
                  <div className="mt-3 rounded-[8px] bg-[rgba(255,255,255,0.03)] border border-[rgba(240,230,208,0.05)] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-cream-subtle mb-0.5">Traction</p>
                    <p className="text-[12px] text-cream-muted leading-relaxed">{startup.traction}</p>
                  </div>
                )}

                {/* Contact row */}
                <div className="mt-4">
                  <ContactRow
                    emailHint={startup.email_hint}
                    phoneHint={startup.phone_hint}
                    isInvestor={isInvestor}
                    startupId={startup.id}
                  />
                </div>

                {/* Website */}
                <div className="mt-3 flex items-center gap-1.5">
                  <Globe className="h-3 w-3 text-cream-subtle" />
                  <span className="text-[12px] text-cream-subtle">{startup.website}</span>
                </div>

              </Card>
            </div>
          ))}
        </div>
      )}

      {/* Investor CTA for founders */}
      {!isInvestor && (
        <div className="mt-12 glass-card flex flex-col items-center justify-between gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div>
            <p className="text-[15px] font-bold text-cream">Want to connect with these founders?</p>
            <p className="mt-0.5 text-[13px] text-cream-muted">Verified investors get full contact access and can express interest directly.</p>
          </div>
          <Link href="/signup?role=investor" className="shrink-0">
            <Button size="sm">
              Apply as investor <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
