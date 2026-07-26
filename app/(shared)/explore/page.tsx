'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  Lock,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { ScrollReveal } from '@/components/ScrollReveal'
import { STARTUP_STAGES, type Startup, type StartupStage } from '@/lib/types'

type LoadStatus = 'loading' | 'loaded' | 'error'

function stageLabel(stage: StartupStage) {
  return STARTUP_STAGES.find((item) => item.value === stage)?.label ?? stage
}

function StartupMark({ startup, size = 'md' }: { startup: Startup; size?: 'md' | 'lg' }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl border border-blue-accent/20 bg-blue-accent/10 font-serif font-bold text-blue-accent ${
        size === 'lg' ? 'h-16 w-16 text-2xl' : 'h-12 w-12 text-xl'
      }`}
      aria-hidden="true"
    >
      {startup.name.slice(0, 1).toUpperCase()}
    </span>
  )
}

function FilterPills({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-ink/40">
        {label}
      </span>
      {options.map((option) => {
        const active = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-full border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.09em] transition-all ${
              active
                ? 'border-blue-accent bg-blue-accent text-white'
                : 'border-ink/15 bg-paper text-ink/55 hover:border-ink/30 hover:text-ink'
            }`}
            aria-pressed={active}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function PublicStartupCard({
  startup,
  delay,
  onSelect,
}: {
  startup: Startup
  delay: number
  onSelect: (startup: Startup) => void
}) {
  return (
    <ScrollReveal delay={delay}>
      <article className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-ink/10 bg-paper transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(8,10,20,.10)]">
        <div className="flex flex-1 flex-col p-6">
          <div className="flex items-start gap-3">
            <StartupMark startup={startup} />
            <div className="min-w-0">
              <h2 className="truncate font-serif text-[19px] font-semibold leading-snug tracking-[-.025em] text-ink">
                {startup.name}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {startup.sector.slice(0, 2).map((sector) => (
                  <span
                    key={sector}
                    className="rounded-full border border-ink/12 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-ink/50"
                  >
                    {sector}
                  </span>
                ))}
                <span className="rounded-full border border-blue-accent/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-blue-accent">
                  {stageLabel(startup.stage)}
                </span>
              </div>
            </div>
          </div>

          {startup.tagline && (
            <p className="mt-4 flex-1 text-[13px] leading-[1.65] text-ink/65">
              {startup.tagline}
            </p>
          )}
        </div>

        <div className="border-t border-ink/10 bg-warm-cream/60 px-6 py-4">
          <p className="flex gap-2 text-[11px] font-medium leading-5 text-ink/50">
            <Lock className="mt-0.5 h-3 w-3 shrink-0 text-ink/35" />
            Sign in to see the complete profile, funding context, and investor actions.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSelect(startup)}
              className="rounded-full border border-blue-accent/35 bg-paper px-3.5 py-1.5 text-[11px] font-semibold text-blue-accent transition-all hover:border-blue-accent hover:bg-blue-accent hover:text-white"
            >
              View company
            </button>
            <Link
              href="/signup"
              className="rounded-full border border-ink/15 bg-paper px-3.5 py-1.5 text-[11px] font-semibold text-ink/60 transition-all hover:bg-ink hover:text-paper"
            >
              Create an account
            </Link>
          </div>
        </div>
      </article>
    </ScrollReveal>
  )
}

function StartupPreview({
  startup,
  onClose,
}: {
  startup: Startup
  onClose: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousActiveElement = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previousActiveElement?.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="public-startup-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-t-[28px] bg-paper shadow-[0_24px_80px_rgba(4,11,26,.28)] sm:rounded-[28px]">
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink/50 transition-colors hover:bg-warm-cream hover:text-ink"
          aria-label="Close company preview"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-7 pb-5 pr-16">
          <div className="flex items-center gap-4">
            <StartupMark startup={startup} size="lg" />
            <div className="min-w-0">
              <h2 id="public-startup-title" className="font-serif text-2xl font-semibold tracking-[-.03em] text-ink">
                {startup.name}
              </h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {startup.sector.slice(0, 2).map((sector) => (
                  <span key={sector} className="rounded-full border border-ink/12 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-ink/50">
                    {sector}
                  </span>
                ))}
                <span className="rounded-full border border-blue-accent/30 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-[.1em] text-blue-accent">
                  {stageLabel(startup.stage)}
                </span>
              </div>
            </div>
          </div>

          {startup.tagline && <p className="mt-5 text-[15px] leading-7 text-ink/70">{startup.tagline}</p>}
          <p className="mt-5 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-ink/35">
            Public preview
          </p>
        </div>

        <div className="mx-5 mb-6 overflow-hidden rounded-2xl border border-ink/10 bg-parchment/70">
          <div className="relative select-none px-6 pb-4 pt-6" aria-hidden="true">
            <div className="space-y-2 blur-[5px]">
              <div className="h-3 w-full rounded-full bg-ink/15" />
              <div className="h-3 w-5/6 rounded-full bg-ink/10" />
              <div className="h-3 w-4/6 rounded-full bg-ink/10" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full border border-ink/15 bg-paper/85 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[.1em] text-ink/50 backdrop-blur-sm">
                Private
              </span>
            </div>
          </div>

          <div className="border-t border-ink/10 px-6 py-5">
            <p className="font-serif text-[19px] font-semibold leading-snug tracking-[-.025em] text-ink">
              The rest of the story is private.
            </p>
            <p className="mt-2 text-[13px] leading-6 text-ink/60">
              Join Stage Zero to view the company&apos;s problem, solution, traction, funding context, and founder introduction.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/signup"
                className="rounded-full bg-blue-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-bright hover:shadow-[0_4px_14px_rgba(75,124,246,.4)]"
              >
                Join Stage Zero
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-ink/20 bg-paper px-4 py-2.5 text-sm font-semibold text-ink/70 transition-all hover:bg-warm-cream hover:text-ink"
              >
                Already a member? Log in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-[20px] border border-ink/10 bg-paper p-6">
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-2xl bg-ink/[.08]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/5 rounded-full bg-ink/[.08]" />
          <div className="h-3 w-1/3 rounded-full bg-ink/[.06]" />
        </div>
      </div>
      <div className="mt-5 space-y-2">
        <div className="h-3 w-full rounded-full bg-ink/[.07]" />
        <div className="h-3 w-5/6 rounded-full bg-ink/[.05]" />
      </div>
      <div className="mt-6 h-16 rounded-xl bg-warm-cream/70" />
    </div>
  )
}

export default function ExplorePage() {
  const [startups, setStartups] = useState<Startup[]>([])
  const [status, setStatus] = useState<LoadStatus>('loading')
  const [sector, setSector] = useState('')
  const [stage, setStage] = useState<StartupStage | ''>('')
  const [selected, setSelected] = useState<Startup | null>(null)

  const loadStartups = useCallback(async () => {
    setStatus('loading')
    try {
      const response = await fetch('/api/startups')
      const result = await response.json() as { data?: Startup[]; error?: string }
      if (!response.ok || result.error) throw new Error(result.error ?? 'Unable to load startups')
      setStartups(result.data ?? [])
      setStatus('loaded')
    } catch {
      setStartups([])
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void loadStartups()
  }, [loadStartups])

  const sectors = Array.from(new Set(startups.flatMap((startup) => startup.sector))).sort()
  const filtered = startups.filter((startup) => {
    const sectorMatches = !sector || startup.sector.includes(sector)
    const stageMatches = !stage || startup.stage === stage
    return sectorMatches && stageMatches
  })
  const isFiltered = Boolean(sector || stage)

  return (
    <div className="overflow-x-hidden bg-parchment text-ink">
      <section className="relative isolate min-h-[500px] px-5 pb-16 pt-36 sm:px-8 lg:px-16 lg:pt-44">
        <div className="paper-grain absolute inset-0 -z-10 opacity-25" />
        <div className="pointer-events-none absolute -right-32 top-20 -z-10 h-[500px] w-[500px] rounded-full border border-navy/[.08]" />
        <div className="pointer-events-none absolute right-20 top-40 -z-10 h-[320px] w-[320px] rounded-full border border-navy/[.06]" />

        <div className="mx-auto max-w-[1440px]">
          <ScrollReveal delay={60}>
            <p className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-blue-accent">
              <span className="h-px w-9 bg-blue-accent" />
              Public preview
            </p>
          </ScrollReveal>
          <ScrollReveal delay={160}>
            <h1 className="mt-6 max-w-3xl font-serif text-[clamp(2.8rem,6vw,5.2rem)] font-bold leading-[1.08] tracking-[-.045em]">
              See what is <em className="font-normal text-blue-accent">taking shape.</em>
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={260}>
            <p className="mt-5 max-w-xl text-[16px] leading-7 text-ink/65">
              A limited look at the companies being built by founders on Stage Zero.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={360}>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#directory"
                className="rounded-full bg-blue-accent px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-blue-bright hover:shadow-[0_4px_18px_rgba(75,124,246,.4)]"
              >
                Explore startups
              </a>
              <Link
                href="/signup"
                className="rounded-full border border-ink/20 bg-paper/50 px-6 py-3.5 text-sm font-semibold transition-all hover:bg-paper hover:shadow-[0_2px_12px_rgba(8,10,20,.08)]"
              >
                Join Stage Zero
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <div className="border-t border-ink/10 bg-paper px-5 py-4 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          <p className="font-mono text-[10px] tracking-[.08em] text-ink/35">
            EXPLORE · STAGE ZERO · PUBLIC DIRECTORY
          </p>
        </div>
      </div>

      <section id="directory" className="scroll-mt-20 bg-paper px-5 py-14 sm:px-8 lg:px-16">
        <div className="mx-auto max-w-[1440px]">
          {status === 'loaded' && startups.length > 0 && (
            <ScrollReveal>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
                <FilterPills
                  label="Sector"
                  options={[{ value: '', label: 'All' }, ...sectors.map((item) => ({ value: item, label: item }))]}
                  value={sector}
                  onChange={setSector}
                />
                <span className="hidden h-4 w-px bg-ink/15 sm:block" />
                <FilterPills
                  label="Stage"
                  options={[
                    { value: '', label: 'All' },
                    ...STARTUP_STAGES.map((item) => ({ value: item.value, label: item.label })),
                  ]}
                  value={stage}
                  onChange={(value) => setStage(value as StartupStage | '')}
                />
              </div>
              <div className="mt-4 h-px bg-ink/10" />
            </ScrollReveal>
          )}

          {status === 'loading' && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center py-24 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink/30">
                <RefreshCw className="h-6 w-6" />
              </span>
              <p className="mt-5 font-serif text-2xl tracking-[-.025em] text-ink">Unable to load startups.</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-ink/50">
                There was a problem fetching the public directory. Please try again.
              </p>
              <button
                type="button"
                onClick={() => void loadStartups()}
                className="mt-6 rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink/70 transition-all hover:bg-warm-cream hover:text-ink"
              >
                Try again
              </button>
            </div>
          )}

          {status === 'loaded' && filtered.length === 0 && (
            <div className="flex flex-col items-center py-24 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-ink/12 bg-paper text-ink/30">
                {isFiltered ? <Search className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </span>
              <p className="mt-5 font-serif text-2xl tracking-[-.025em] text-ink">
                {isFiltered ? 'No startups match this filter.' : 'No public startups yet.'}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-ink/50">
                {isFiltered
                  ? 'Try a different sector or stage combination.'
                  : 'Approved companies will appear here when their profiles become active.'}
              </p>
              {isFiltered && (
                <button
                  type="button"
                  onClick={() => {
                    setSector('')
                    setStage('')
                  }}
                  className="mt-6 rounded-full border border-ink/20 bg-paper px-5 py-2.5 text-sm font-semibold text-ink/70 transition-all hover:bg-warm-cream hover:text-ink"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {status === 'loaded' && filtered.length > 0 && (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((startup, index) => (
                <PublicStartupCard
                  key={startup.id}
                  startup={startup}
                  delay={Math.min(index, 5) * 70}
                  onSelect={setSelected}
                />
              ))}
            </div>
          )}

          {status === 'loaded' && (
            <p className="mt-14 text-center font-mono text-[10px] tracking-[.08em] text-ink/30">
              SHOWING PUBLIC-ONLY INFORMATION · PRIVATE DETAILS REQUIRE AUTHENTICATION
            </p>
          )}
        </div>
      </section>

      <section className="border-t border-ink/10 bg-parchment px-5 py-16 sm:px-8 lg:px-16">
        <ScrollReveal>
          <div className="mx-auto flex max-w-[860px] flex-col items-center gap-5 text-center">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-ink/40">Ready for more?</p>
            <h2 className="font-serif text-[clamp(2rem,4.5vw,3.4rem)] font-semibold leading-[1.1] tracking-[-.04em] text-ink">
              This is a limited preview. The full story lives inside.
            </h2>
            <p className="max-w-md text-[15px] leading-7 text-ink/60">
              Join Stage Zero to access complete company profiles and founder introductions.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-amber px-6 py-3.5 text-sm font-semibold text-navy transition-all hover:shadow-[0_4px_18px_rgba(232,165,60,.4)]"
              >
                Join Stage Zero <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-ink/20 px-6 py-3.5 text-sm font-semibold text-ink/65 transition-all hover:bg-ink/[.05] hover:text-ink"
              >
                Already a member? Log in
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {selected && <StartupPreview startup={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
