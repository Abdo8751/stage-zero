import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const previewStartups = [
  {
    name: 'NilePay',
    tagline: 'Mobile payments for Egypt\'s informal economy',
    sector: ['Fintech'],
    stage: 'Seed',
    raise: 'EGP 2.5M',
  },
  {
    name: 'HarvestIQ',
    tagline: 'AI-powered crop monitoring for smallholder farms',
    sector: ['Agtech'],
    stage: 'Pre-seed',
    raise: 'EGP 800K',
  },
  {
    name: 'MedBridge',
    tagline: 'Connecting rural clinics to specialist care',
    sector: ['Healthtech'],
    stage: 'Series A',
    raise: 'EGP 12M',
  },
]

const steps = [
  {
    number: '01',
    title: 'Create your profile',
    description:
      'Founders list their startup in minutes. Investors verify their credentials to access the network.',
  },
  {
    number: '02',
    title: 'Get discovered',
    description:
      'Verified investors browse curated startups. Founders receive interest from serious backers.',
  },
  {
    number: '03',
    title: 'Start the conversation',
    description:
      'When there\'s mutual interest, chat opens directly. No cold emails. No gatekeepers.',
  },
]

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-4xl text-center">
          <Badge variant="gold" className="mb-6">
            Egypt&apos;s founder-investor network
          </Badge>
          <h1 className="text-balance text-5xl leading-tight sm:text-6xl md:text-7xl">
            Your startup&apos;s first stage
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            Stage Zero connects founders under 30 with verified investors who believe
            in Egyptian innovation. Premium introductions. Real conversations. Zero noise.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/signup?role=founder">
              <Button size="lg">List your startup</Button>
            </Link>
            <Link href="/signup?role=investor">
              <Button variant="secondary" size="lg">
                Browse startups
              </Button>
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-48 w-48 rounded-full bg-navy/5 blur-3xl" />
      </section>

      {/* How it works */}
      <section className="border-y border-muted/30 bg-white/20 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-4xl">How it works</h2>
            <p className="mt-3 text-muted">Three steps from zero to your first investor conversation</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <Card key={step.number} className="text-center md:text-left">
                <span className="font-heading text-3xl text-gold">{step.number}</span>
                <h3 className="mt-4 text-2xl">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-muted">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Blurred preview */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-4xl">Active listings</h2>
              <p className="mt-2 text-muted">Join to unlock full startup profiles</p>
            </div>
            <Link href="/signup?role=investor">
              <Button variant="secondary">Get verified access</Button>
            </Link>
          </div>

          <div className="relative">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {previewStartups.map((startup) => (
                <Card key={startup.name} className="select-none blur-[6px]">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl">{startup.name}</h3>
                    <Badge variant="gold">{startup.stage}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{startup.tagline}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {startup.sector.map((s) => (
                      <Badge key={s} variant="muted">
                        {s}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-4 font-medium text-navy">Raising {startup.raise}</p>
                </Card>
              ))}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="mx-4 max-w-md text-center shadow-lg">
                <p className="font-heading text-2xl">Members only</p>
                <p className="mt-2 text-sm text-muted">
                  Verified investors can browse full profiles, pitch decks, and express interest.
                </p>
                <Link href="/signup" className="mt-6 inline-block">
                  <Button fullWidth>Create your account</Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-muted/30 px-4 py-12 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <p className="font-heading text-2xl font-bold text-navy">Stage Zero Egypt</p>
            <p className="mt-1 text-sm text-muted">Your startup&apos;s first stage.</p>
          </div>
          <div className="flex gap-6 text-sm text-muted">
            <Link href="/login" className="hover:text-navy">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-navy">
              Sign up
            </Link>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-center text-xs text-muted/80">
          © {new Date().getFullYear()} Stage Zero Egypt. Built for founders under 30.
        </p>
      </footer>
    </>
  )
}
