import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowRight, TrendingUp, Shield, Zap, Users } from 'lucide-react'

const previewStartups = [
  { name: 'NilePay',    initial: 'N', tagline: "Mobile payments for Egypt's informal economy",    sector: ['Fintech'],    stage: 'Seed',    raise: 'EGP 2.5M' },
  { name: 'HarvestIQ',  initial: 'H', tagline: 'AI-powered crop monitoring for smallholder farms', sector: ['Agtech'],     stage: 'Pre-Seed', raise: 'EGP 800K' },
  { name: 'MedBridge',  initial: 'M', tagline: 'Connecting rural clinics to specialist care',      sector: ['Healthtech'], stage: 'Series A', raise: 'EGP 12M' },
]

const steps = [
  {
    icon: Shield,
    number: '01',
    title: 'Verified access only',
    description: 'Investors complete a verification process. Founders list their startup in minutes. Every participant is real.',
  },
  {
    icon: Zap,
    number: '02',
    title: 'Curated deal flow',
    description: 'Browse active listings filtered by stage, sector, and raise size. No noise. No spam. Only serious opportunities.',
  },
  {
    icon: TrendingUp,
    number: '03',
    title: 'Direct conversations',
    description: 'Mutual interest opens a private channel. No cold emails. No gatekeepers. Zero friction from intro to term sheet.',
  },
]

const stats = [
  { value: '200+',      label: 'Active founders',    icon: Users },
  { value: '85',        label: 'Verified investors',  icon: Shield },
  { value: 'EGP 140M+', label: 'Capital in network',  icon: TrendingUp },
  { value: '12',        label: 'Sectors covered',     icon: Zap },
]

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">

      {/* Animated background orbs */}
      <div className="pointer-events-none fixed right-[-10%] top-[2%] h-[700px] w-[700px] rounded-full bg-[radial-gradient(circle,rgba(240,230,208,0.08)_0%,transparent_60%)] blur-3xl orb-animation" />
      <div className="pointer-events-none fixed left-[-5%] top-[40%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(75,124,246,0.10)_0%,transparent_60%)] blur-3xl orb-animation" style={{ animationDelay: '-3s' }} />
      <div className="pointer-events-none fixed right-[10%] bottom-[10%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(232,165,60,0.07)_0%,transparent_60%)] blur-3xl orb-animation" style={{ animationDelay: '-6s' }} />

      {/* ── Hero ──────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-5 pb-24 pt-24 text-center sm:px-8">

        {/* Eyebrow badge — cream tinted */}
        <div className="animate-fade-in mb-7 inline-flex items-center gap-2.5 rounded-full border border-[rgba(240,230,208,0.22)] bg-[rgba(240,230,208,0.07)] px-4 py-2 badge-pulse">
          <span className="h-1.5 w-1.5 rounded-full bg-cream shadow-[0_0_8px_rgba(240,230,208,0.9)]" />
          <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-cream">
            Egypt&apos;s Investor Marketplace
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-slide-up delay-100 max-w-3xl text-balance text-[52px] font-black leading-[1.04] tracking-tightest text-cream sm:text-[68px] md:text-[82px]">
          Where capital
          <br />
          <span className="text-gradient-cream">meets vision</span>
        </h1>

        <p className="animate-slide-up delay-200 mx-auto mt-7 max-w-lg text-[15px] leading-[1.75] text-cream-muted sm:text-[16px]">
          Stage Zero is the private marketplace where verified investors discover
          Egypt&apos;s most ambitious founders.{' '}
          <span className="font-semibold text-cream">Serious capital. Real startups. Zero noise.</span>
        </p>

        {/* CTAs */}
        <div className="animate-slide-up delay-300 mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link href="/signup?role=investor">
            <Button size="lg" className="min-w-[190px]">
              Start investing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/signup?role=founder">
            <Button variant="secondary" size="lg" className="min-w-[190px]">
              List your startup
            </Button>
          </Link>
        </div>

        <p className="animate-fade-in delay-500 mt-6 text-[11px] tracking-[0.10em] uppercase text-cream-subtle">
          Invitation-only verification · Egyptian startups only
        </p>

        {/* Stats grid */}
        <div className="animate-slide-up delay-400 mt-16 grid w-full max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass-card px-4 py-5 text-center">
              <p className="text-[24px] font-black tracking-tightest text-cream">{s.value}</p>
              <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-cream-subtle">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────── */}
      <section className="relative border-y border-[rgba(240,230,208,0.06)] bg-[rgba(4,11,26,0.4)] px-5 py-28 sm:px-8">
        <div className="mx-auto max-w-6xl">

          <div className="mb-16 text-center">
            <p className="mb-3 text-[11px] font-bold tracking-[0.16em] uppercase text-cream-muted">How it works</p>
            <h2 className="text-[34px] font-black tracking-tightest text-cream sm:text-[44px]">
              Built for serious deal flow
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-cream-muted">
              Three steps from zero to your first verified investor conversation.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="animate-scale-in"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <Card hoverable>
                  <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.22)]">
                      <step.icon className="h-4 w-4 text-blue-bright" />
                    </div>
                    <span className="text-[32px] font-black tracking-tightest text-[rgba(240,230,208,0.12)]">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mt-5 text-[17px] font-bold tracking-tight text-cream">{step.title}</h3>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-cream-muted">{step.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live listings ────────────────────────────── */}
      <section className="px-5 py-28 sm:px-8">
        <div className="mx-auto max-w-6xl">

          <div className="mb-12 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-3 text-[11px] font-bold tracking-[0.16em] uppercase text-cream-muted">Active listings</p>
              <h2 className="text-[32px] font-black tracking-tightest text-cream sm:text-[40px]">Live on Stage Zero</h2>
              <p className="mt-2 text-[13px] text-cream-muted">Verify your investor status to unlock full profiles.</p>
            </div>
            <Link href="/signup?role=investor">
              <Button variant="secondary" size="sm">
                Get verified access
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="relative">
            {/* Blurred cards */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 pointer-events-none select-none">
              {previewStartups.map((startup) => (
                <div key={startup.name} className="blur-[10px] opacity-30">
                  <Card>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.20)] text-blue-bright font-black text-[15px]">
                        {startup.initial}
                      </div>
                      <Badge variant="gold">{startup.stage}</Badge>
                    </div>
                    <div className="mt-4">
                      <h3 className="text-[16px] font-bold text-cream">{startup.name}</h3>
                      <p className="mt-1.5 text-[13px] text-cream-muted">{startup.tagline}</p>
                    </div>
                    <div className="mt-4 flex gap-1.5">
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

            {/* Gate overlay */}
            <div className="absolute inset-0 flex items-center justify-center z-10 px-4">
              <Card className="w-full max-w-sm text-center bg-[rgba(4,11,26,0.88)] border-glass-border-bright shadow-[0_32px_80px_rgba(0,0,0,0.8)]">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.25)]">
                  <Shield className="h-5 w-5 text-blue-bright" />
                </div>
                <h3 className="text-[22px] font-black tracking-tight text-cream">Investors only</h3>
                <p className="mt-3 text-[13px] leading-relaxed text-cream-muted">
                  Verified investors get full access — pitch decks, traction metrics, and direct founder contact.
                </p>
                <Link href="/signup" className="mt-6 block">
                  <Button fullWidth>
                    Apply for access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <p className="mt-3 text-[11px] text-cream-subtle">Free to apply · Reviewed within 48 hours</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="border-t border-[rgba(240,230,208,0.06)] bg-[rgba(4,11,26,0.5)] px-5 py-14 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-[14px] font-black tracking-[-0.04em] text-cream uppercase">STAGE ZERO</span>
            </div>
            <p className="mt-1 text-[12px] text-cream-subtle">Egypt&apos;s investor marketplace</p>
          </div>
          <div className="flex gap-6">
            <Link href="/login"  className="text-[13px] text-cream-subtle hover:text-cream-muted transition-colors">Log in</Link>
            <Link href="/signup" className="text-[13px] text-cream-subtle hover:text-cream-muted transition-colors">Sign up</Link>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-6xl border-t border-[rgba(240,230,208,0.04)] pt-6 text-center">
          <p className="text-[10px] tracking-[0.12em] uppercase text-cream-subtle">
            © {new Date().getFullYear()} Stage Zero Egypt · For Founders Under 30
          </p>
        </div>
      </footer>
    </div>
  )
}
