import Link from 'next/link'
import { ArrowRight, CircleDot, Sparkles } from 'lucide-react'
import { BrandMark } from '@/components/BrandMark'
import { ParallaxOrb, ScrollReveal, StaggerReveal } from '@/components/ScrollReveal'

const steps = [
  ['01', 'Build your profile', 'Share what you are building, your current stage, and the context investors need.'],
  ['02', 'Find the right fit', 'Founders and verified investors discover relevant opportunities without the usual noise.'],
  ['03', 'Start a conversation', 'Mutual interest opens a direct, private conversation inside Stage Zero.'],
]

export default function LandingPage() {
  return (
    <div className="overflow-hidden bg-parchment text-ink">
      <section className="relative isolate min-h-[780px] px-5 pb-20 pt-32 sm:px-8 lg:px-16 lg:pt-40">
        <div className="paper-grain absolute inset-0 -z-10 opacity-[.28]" />
        <ParallaxOrb
          speed={0.18}
          className="pointer-events-none absolute -right-40 top-24 -z-10 h-[680px] w-[680px] rounded-full border border-navy/10 will-change-transform"
        />
        <ParallaxOrb
          speed={0.1}
          className="pointer-events-none absolute right-10 top-40 -z-10 h-[430px] w-[430px] rounded-full border border-navy/10 will-change-transform"
        />
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <ScrollReveal delay={80}>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.16em] text-blue-accent">
                <span className="h-px w-9 bg-blue-accent" />
                Egypt&apos;s founder–investor network
              </p>
            </ScrollReveal>
            <ScrollReveal delay={180}>
              <h1 className="mt-7 max-w-3xl font-serif text-[clamp(3.45rem,7vw,6.35rem)] font-bold leading-[1.02] tracking-[-.045em]">
                Where founders meet their <em className="font-normal text-blue-accent">first believers.</em>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={280}>
              <p className="mt-7 max-w-xl text-[17px] leading-7 text-ink/70">
                Stage Zero connects ambitious Egyptian founders with verified investors ready to understand the work behind the ask.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={380}>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/signup?role=founder" className="inline-flex items-center rounded-full bg-blue-accent px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-bright">
                  Join as a founder <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link href="/signup?role=investor" className="inline-flex items-center rounded-full border border-ink/20 bg-paper/35 px-6 py-4 text-sm font-semibold transition hover:bg-paper">
                  Apply as an investor <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </ScrollReveal>
            <ScrollReveal delay={480}>
              <p className="mt-11 font-mono text-[11px] tracking-[.08em] text-ink/45">PRIVATE NETWORK · BUILT FOR EGYPT</p>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="right" delay={260}>
            <div className="relative mx-auto w-full max-w-[540px]">
              <div className="absolute -left-5 top-16 hidden h-24 w-24 rounded-full border border-amber/55 sm:block" />
              <div className="glass-dark relative overflow-hidden rounded-[28px] p-5 text-paper shadow-[0_16px_48px_rgba(4,11,26,.48)] sm:p-7">
                <div className="flex items-start justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="font-serif text-[28px] leading-tight tracking-[-.03em] text-paper">How an introduction begins</p>
                    <p className="mt-2 font-mono text-[10px] font-bold uppercase tracking-[.14em] text-amber">Private by design</p>
                  </div>
                  <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-amber" aria-hidden="true">✦</span>
                </div>

                <div className="relative mt-6 space-y-6 before:absolute before:bottom-9 before:left-[15px] before:top-9 before:w-px before:bg-white/20">
                  <div className="relative grid grid-cols-[32px_1fr] gap-3">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-amber/50 bg-navy-surface font-mono text-[10px] font-bold text-amber">01</span>
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[.13em] text-paper/55">Startup profile</p>
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/[.055] p-3">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-paper/65">
                          <span>Company</span><span>Sector</span><span>Stage</span><span>Raising</span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs leading-5 text-paper/65">A founder shares the company, the problem, and what they are building.</p>
                    </div>
                  </div>

                  <div className="relative grid grid-cols-[32px_1fr] gap-3">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-blue-accent/60 bg-navy-surface font-mono text-[10px] font-bold text-blue-bright">02</span>
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[.13em] text-paper/55">Investor interest</p>
                      <div className="mt-3 flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-bright font-serif text-sm text-navy">I</span>
                        <span className="h-px flex-1 bg-blue-accent/70" />
                        <ArrowRight className="h-4 w-4 text-blue-bright" />
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 text-xs text-paper">S</span>
                      </div>
                      <span className="mt-3 inline-block rounded-full border border-blue-accent/60 px-2.5 py-1 font-mono text-[9px] font-bold tracking-[.12em] text-blue-bright">INTEREST SENT</span>
                      <p className="mt-3 text-xs leading-5 text-paper/65">An approved investor reviews the full context and sends a genuine expression of interest.</p>
                    </div>
                  </div>

                  <div className="relative grid grid-cols-[32px_1fr] gap-3">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-amber/50 bg-navy-surface font-mono text-[10px] font-bold text-amber">03</span>
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[.13em] text-paper/55">Private conversation</p>
                      <div className="mt-3 rounded-xl border border-white/10 bg-white/[.04] p-3">
                        <div className="flex items-end gap-2">
                          <span className="rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-[10px] text-paper/80">Hello</span>
                          <span className="ml-auto rounded-2xl rounded-br-sm bg-blue-accent px-3 py-2 text-[10px] text-white">Welcome</span>
                        </div>
                      </div>
                      <span className="mt-3 inline-block rounded-full border border-amber/50 px-2.5 py-1 font-mono text-[9px] font-bold tracking-[.12em] text-amber">INTRODUCTION OPEN</span>
                      <p className="mt-3 text-xs leading-5 text-paper/65">The founder accepts. A private conversation opens between them.</p>
                    </div>
                  </div>
                </div>

                <p className="mt-6 border-t border-white/10 pt-4 text-center font-mono text-[9px] font-bold uppercase tracking-[.1em] text-paper/45">
                  Profile → Interest → Acceptance → Conversation
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-20 bg-paper px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <ScrollReveal>
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-blue-accent">How it works</p>
              <h2 className="mt-4 font-serif text-5xl font-semibold leading-[1.12] tracking-[-.035em] md:text-6xl">Made for the moment <em className="font-normal">before momentum.</em></h2>
            </div>
          </ScrollReveal>
          <StaggerReveal className="mt-14 grid overflow-hidden rounded-3xl border border-ink/10 md:grid-cols-3">
            {steps.map(([number, title, copy], index) => (
              <article key={number} className={`h-full min-h-[270px] p-7 md:p-9 ${index !== 2 ? 'border-b border-ink/10 md:border-b-0 md:border-r' : ''}`}>
                <p className="font-mono text-xs text-blue-accent">{number}</p>
                <div className="mt-12 flex h-11 w-11 items-center justify-center rounded-full bg-warm-cream text-amber">
                  {index === 2 ? <Sparkles className="h-5 w-5" /> : <CircleDot className="h-5 w-5" />}
                </div>
                <h3 className="mt-5 text-lg font-semibold tracking-[-.02em]">{title}</h3>
                <p className="mt-3 max-w-xs text-sm font-normal leading-6 text-ink/60">{copy}</p>
              </article>
            ))}
          </StaggerReveal>
        </div>
      </section>

      <section id="founders" className="scroll-mt-20 bg-parchment px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
        <ScrollReveal>
          <div className="glass-dark mx-auto grid max-w-[1440px] overflow-hidden rounded-[30px] text-paper lg:grid-cols-[.9fr_1.1fr]">
            <div className="relative min-h-[340px] overflow-hidden bg-navy-surface p-8 md:p-12">
              <div className="absolute -bottom-24 -left-20 h-80 w-80 rounded-full border border-blue-accent/40" />
              <div className="absolute bottom-16 left-24 h-44 w-44 rounded-full bg-blue-accent/25 blur-3xl" />
              <div className="relative flex h-full flex-col justify-between">
                <BrandMark className="!text-paper" />
                <p className="max-w-xs font-serif text-4xl font-normal leading-tight tracking-[-.035em] text-paper">Your work deserves a thoughtful first room.</p>
              </div>
            </div>
            <div className="flex flex-col justify-center p-8 md:p-12">
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-amber">For founders</p>
              <h2 className="mt-4 max-w-xl font-serif text-5xl font-semibold leading-[1.1] tracking-[-.04em] text-paper">Meet people prepared to see the whole picture.</h2>
              <p className="mt-6 max-w-xl text-[15px] font-normal leading-7 text-paper/65">Give your company the room it needs to be understood, then manage genuine investor interest in one place.</p>
              <Link href="/signup?role=founder" className="mt-8 inline-flex w-fit items-center rounded-full border border-white/25 px-5 py-3 text-sm font-semibold transition hover:bg-paper hover:text-navy">Build your profile <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <section id="investors" className="scroll-mt-20 bg-warm-cream px-5 py-20 sm:px-8 lg:px-16 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
          <ScrollReveal direction="left">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-blue-accent">For investors</p>
              <h2 className="mt-4 max-w-2xl font-serif text-5xl font-semibold leading-[1.1] tracking-[-.04em] md:text-6xl">Find conviction before consensus.</h2>
              <p className="mt-6 max-w-xl text-[17px] font-normal leading-7 text-ink/65">Browse founder profiles after verification and express interest when there is a real reason to talk.</p>
              <Link href="/signup?role=investor" className="mt-8 inline-flex items-center rounded-full bg-blue-accent px-6 py-4 text-sm font-semibold text-white transition hover:bg-blue-bright">Apply as an investor <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </div>
          </ScrollReveal>
          <ScrollReveal direction="right" delay={160}>
            <aside className="glass-light rounded-3xl p-6 md:p-8">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-ink/45">Stage Zero standard</p>
              <div className="mt-7 space-y-5">
                {[
                  ['Context first', 'Profiles explain the work, stage, and funding ask.'],
                  ['Verified access', 'Investor applications are reviewed before full access.'],
                  ['Direct connection', 'Mutual interest creates a private conversation.'],
                ].map(([title, copy], index) => (
                  <div className="flex gap-4" key={title}>
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber font-mono text-xs font-bold text-navy">0{index + 1}</span>
                    <div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm font-normal leading-6 text-ink/60">{copy}</p></div>
                  </div>
                ))}
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </section>

      <section className="bg-parchment px-5 py-20 sm:px-8 lg:px-16">
        <ScrollReveal>
          <div className="mx-auto max-w-[1040px] rounded-[30px] bg-amber p-8 text-navy md:flex md:items-center md:justify-between md:p-12">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-navy/60">Start here</p>
              <h2 className="mt-4 max-w-xl font-serif text-5xl font-semibold leading-[1.1] tracking-[-.04em]">The right conversation could be closer than you think.</h2>
            </div>
            <Link href="/signup" className="mt-7 inline-flex shrink-0 items-center rounded-full bg-navy px-6 py-4 text-sm font-semibold text-paper transition hover:bg-navy-surface md:mt-0">Join Stage Zero <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </div>
        </ScrollReveal>
      </section>

      <footer className="bg-navy px-5 py-12 text-paper sm:px-8 lg:px-16">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 md:flex-row md:items-end">
          <div><BrandMark className="!text-paper" /><p className="mt-4 max-w-sm text-sm font-normal leading-6 text-paper/50">A considered platform for founders and the people who believe in what comes next.</p></div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-paper/60"><Link href="/explore" className="hover:text-paper">Explore</Link><Link href="/login" className="hover:text-paper">Log in</Link><Link href="/signup" className="hover:text-paper">Sign up</Link></div>
          <p className="text-xs text-paper/35">© {new Date().getFullYear()} Stage Zero</p>
        </div>
      </footer>
    </div>
  )
}
