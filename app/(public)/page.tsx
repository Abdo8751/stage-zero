import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { HeroAnimation } from '@/components/HeroAnimation'
import { ArrowRight, TrendingUp, Shield, Zap, Users } from 'lucide-react'

const previewStartups = [
  { name: 'NilePay',   initial: 'N', tagline: "Mobile payments for Egypt's informal economy",    sector: ['Fintech'],    stage: 'Seed',     raise: 'EGP 2.5M' },
  { name: 'HarvestIQ', initial: 'H', tagline: 'AI-powered crop monitoring for smallholder farms', sector: ['Agtech'],     stage: 'Pre-Seed', raise: 'EGP 800K' },
  { name: 'MedBridge', initial: 'M', tagline: 'Connecting rural clinics to specialist care',      sector: ['Healthtech'], stage: 'Series A', raise: 'EGP 12M' },
]

const stats = [
  { value: '200+',      label: 'Founders' },
  { value: '85',        label: 'Investors' },
  { value: 'EGP 140M', label: 'In network' },
  { value: '12',        label: 'Sectors' },
]

const steps = [
  {
    icon: Shield,
    title: 'Real people, verified',
    description: "Investors go through a short verification. Founders list in under 20 minutes. Everyone here is serious — that's the whole point.",
  },
  {
    icon: Zap,
    title: 'No noise, just deal flow',
    description: "Filter by stage, sector and raise size. You'll see listings that match what you're actually looking for — not everything ever created.",
  },
  {
    icon: Users,
    title: 'Talk directly',
    description: "When both sides are interested, a private chat opens. No back-and-forth over email, no intros needed. Just a conversation.",
  },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">

      {/* ── Animated background blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Primary warm cream — top-left */}
        <div className="blob-a absolute -top-[22%] -left-[12%] h-[80vh] w-[80vw] rounded-full bg-[radial-gradient(circle,rgba(243,224,155,0.34)_0%,transparent_65%)] blur-[90px]" />
        {/* Cream — top-right */}
        <div className="blob-b absolute -top-[12%] right-[-18%] h-[65vh] w-[65vw] rounded-full bg-[radial-gradient(circle,rgba(240,228,196,0.24)_0%,transparent_65%)] blur-[80px]" />
        {/* Blue — mid-left */}
        <div className="blob-c absolute top-[35%] -left-[10%] h-[55vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(75,124,246,0.12)_0%,transparent_65%)] blur-[80px]" />
        {/* Warm amber — bottom-right */}
        <div className="blob-b absolute bottom-[-8%] right-[3%] h-[50vh] w-[50vw] rounded-full bg-[radial-gradient(circle,rgba(232,165,60,0.10)_0%,transparent_65%)] blur-[80px]" style={{ animationDelay: '-6s' }} />
        {/* Cream accent — center-right mid */}
        <div className="blob-d absolute top-[50%] right-[-5%] h-[45vh] w-[42vw] rounded-full bg-[radial-gradient(circle,rgba(240,220,175,0.14)_0%,transparent_65%)] blur-[70px]" style={{ animationDelay: '-3s' }} />
        {/* Blue accent — bottom-left */}
        <div className="blob-e absolute bottom-[5%] left-[10%] h-[40vh] w-[40vw] rounded-full bg-[radial-gradient(circle,rgba(75,124,246,0.09)_0%,transparent_65%)] blur-[70px]" style={{ animationDelay: '-5s' }} />
        {/* Small warm cream — center top */}
        <div className="blob-c absolute top-[8%] left-[35%] h-[35vh] w-[35vw] rounded-full bg-[radial-gradient(circle,rgba(243,218,150,0.16)_0%,transparent_65%)] blur-[60px]" style={{ animationDelay: '-2s' }} />
      </div>

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative flex min-h-[88vh] items-center px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-16">

            {/* ── Left: content ── */}
            <div className="flex-1">

              <div className="animate-fade-in mb-6 inline-flex items-center gap-2.5 rounded-full border border-[rgba(240,230,208,0.24)] bg-[rgba(240,230,208,0.09)] px-4 py-1.5 badge-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-cream shadow-[0_0_8px_rgba(240,230,208,0.8)]" />
                <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-cream">
                  Egypt&apos;s Founder–Investor Network
                </span>
              </div>

              <h1 className="animate-slide-up delay-100 max-w-[560px] text-[46px] font-black leading-[1.04] tracking-tightest text-cream sm:text-[60px] md:text-[72px]">
                Where capital
                <br />
                <span className="text-gradient-cream">meets vision</span>
              </h1>

              <p className="animate-slide-up delay-200 mt-6 max-w-[440px] text-[15px] leading-[1.75] text-cream-muted">
                Stage Zero connects ambitious Egyptian founders with the investors who want to back them.{' '}
                <span className="font-semibold text-[rgba(240,230,208,0.88)]">No cold emails. No middlemen.</span>
              </p>

              {/* 3 CTAs */}
              <div className="animate-slide-up delay-300 mt-10 flex flex-wrap gap-3">
                <Link href="/signup?role=investor">
                  <Button size="lg">
                    I&apos;m an investor
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/signup?role=founder">
                  <Button variant="secondary" size="lg">
                    I&apos;m a founder
                  </Button>
                </Link>
                <Link href="/explore">
                  <Button variant="outline" size="lg">
                    Browse startups
                  </Button>
                </Link>
              </div>

              <p className="animate-fade-in delay-500 mt-5 text-[12px] tracking-[0.07em] text-cream-subtle">
                Free to join · Egyptian founders &amp; investors only
              </p>
            </div>

            {/* ── Right: node animation ── */}
            <div className="animate-fade-in delay-300 w-full lg:w-[460px] lg:shrink-0">
              <HeroAnimation />
            </div>

          </div>

          {/* ── Stats strip ── */}
          <div className="animate-slide-up delay-400 mt-14 flex overflow-hidden rounded-2xl border border-[rgba(240,230,208,0.13)] bg-[rgba(240,230,208,0.05)] divide-x divide-[rgba(240,230,208,0.09)]">
            {stats.map((s) => (
              <div key={s.label} className="flex-1 px-2 py-5 text-center">
                <p className="text-[20px] font-black tracking-tightest text-cream sm:text-[24px]">{s.value}</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.07em] text-cream-subtle">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Explore teaser ───────────────────────────── */}
      <section className="relative px-5 py-20 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[rgba(240,218,150,0.05)] via-transparent to-transparent" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-amber">Live listings</p>
              <h2 className="text-[28px] font-black tracking-tightest text-cream sm:text-[38px]">What&apos;s building in Egypt</h2>
              <p className="mt-1.5 text-[14px] text-cream-muted max-w-sm">
                Real startups, raising now. Full profiles unlocked for verified investors.
              </p>
            </div>
            <Link href="/explore">
              <Button variant="secondary" size="sm" className="shrink-0">
                Browse all startups
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="relative">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pointer-events-none select-none">
              {previewStartups.map((startup) => (
                <div key={startup.name} className="blur-[7px] opacity-40">
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.20)] text-blue-bright font-black text-[15px]">
                        {startup.initial}
                      </div>
                      <Badge variant="gold">{startup.stage}</Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-[16px] font-bold text-cream">{startup.name}</h3>
                      <p className="mt-1 text-[13px] text-cream-muted">{startup.tagline}</p>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      {startup.sector.map((s) => <Badge key={s} variant="muted">{s}</Badge>)}
                    </div>
                    <div className="mt-4 flex items-center gap-1.5 border-t border-[rgba(240,230,208,0.06)] pt-4">
                      <TrendingUp className="h-3.5 w-3.5 text-amber" />
                      <span className="text-[13px] font-bold text-amber">Raising {startup.raise}</span>
                    </div>
                  </Card>
                </div>
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
              <Card className="w-full max-w-sm text-center bg-[rgba(6,12,28,0.94)] border-[rgba(240,230,208,0.18)] shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
                <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(240,218,150,0.12)] border border-[rgba(240,218,150,0.28)]">
                  <Shield className="h-5 w-5 text-amber" />
                </div>
                <h3 className="text-[20px] font-black tracking-tight text-cream">Investors only</h3>
                <p className="mt-2.5 text-[13px] leading-relaxed text-cream-muted">
                  Pitch decks, traction data, and direct founder contact — unlocked once you&apos;re verified.
                </p>
                <Link href="/signup?role=investor" className="mt-5 block">
                  <Button fullWidth>
                    Apply for access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/explore" className="mt-3 block text-[12px] text-cream-subtle hover:text-cream transition-colors">
                  Or browse anonymously →
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="relative border-y border-[rgba(240,230,208,0.09)] bg-[rgba(240,230,208,0.025)] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 max-w-md">
            <p className="mb-2 text-[11px] font-bold tracking-[0.14em] uppercase text-cream-muted">How it works</p>
            <h2 className="text-[28px] font-black tracking-tightest text-cream sm:text-[38px]">Simple by design</h2>
            <p className="mt-3 text-[14px] leading-relaxed text-cream-muted">
              We kept it straightforward. Three things happen, in this order.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, i) => (
              <Card key={step.title} hoverable className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(240,218,150,0.10)] border border-[rgba(240,218,150,0.22)]">
                  <step.icon className="h-4 w-4 text-amber" />
                </div>
                <span className="absolute right-5 top-5 text-[36px] font-black text-[rgba(240,230,208,0.07)]">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 text-[16px] font-bold tracking-tight text-cream">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-cream-muted">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-3xl border border-[rgba(240,230,208,0.16)] bg-gradient-to-br from-[rgba(240,218,150,0.09)] via-[rgba(9,17,42,0.50)] to-[rgba(75,124,246,0.09)] p-12 text-center shadow-[0_32px_80px_rgba(0,0,0,0.45)]">
            <div className="pointer-events-none absolute left-1/2 -top-16 -translate-x-1/2 h-[220px] w-[560px] rounded-full bg-[radial-gradient(ellipse,rgba(240,218,150,0.20)_0%,transparent_65%)] blur-2xl" />
            <h2 className="relative text-[28px] font-black tracking-tightest text-cream sm:text-[38px]">
              Ready to get started?
            </h2>
            <p className="relative mt-3 text-[14px] text-cream-muted">
              Join the founders and investors already using Stage Zero.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/signup?role=founder">
                <Button size="lg" className="min-w-[190px]">
                  List your startup <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/signup?role=investor">
                <Button variant="secondary" size="lg" className="min-w-[190px]">
                  Verify as investor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-[rgba(240,230,208,0.08)] bg-[rgba(4,11,26,0.55)] px-5 py-12 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[15px] font-black tracking-[-0.04em] text-cream uppercase">Stage Zero</p>
              <p className="mt-1 text-[12px] text-cream-subtle max-w-[200px] leading-relaxed">
                Egypt&apos;s private network for founders and investors.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <Link href="/explore" className="text-[13px] text-cream-subtle hover:text-cream transition-colors">Explore startups</Link>
                <Link href="/login"   className="text-[13px] text-cream-subtle hover:text-cream transition-colors">Log in</Link>
                <Link href="/signup"  className="text-[13px] text-cream-subtle hover:text-cream transition-colors">Sign up</Link>
              </div>
              <a
                href="https://instagram.com/stagezero.eg"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-2 text-[13px] text-cream-subtle hover:text-cream transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
                </svg>
                @stagezero.eg
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-[rgba(240,230,208,0.06)] pt-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-cream-subtle">© {new Date().getFullYear()} Stage Zero Egypt</p>
            <p className="text-[11px] text-cream-subtle">For founders and investors in Egypt</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
