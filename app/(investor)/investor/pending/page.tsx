import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Check, Clock3, Sparkles } from 'lucide-react'
import { PendingActions } from '@/components/investor/PendingActions'
import { getInvestorRoute } from '@/lib/auth'
import { getInvestorProfileForUserId } from '@/lib/investor'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function InvestorPendingPage() {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const investor = await getInvestorProfileForUserId(user.id)

  if (!investor) {
    redirect('/investor/verify')
  }

  if (investor.verification_status !== 'pending') {
    redirect(getInvestorRoute(investor.verification_status))
  }

  return (
    <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-28 sm:px-6">
      <div className="paper-grain pointer-events-none fixed inset-0 -z-10 opacity-20" />
      <Link
        href="/browse"
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink/60 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to opportunities
      </Link>

      <Card className="p-7 sm:p-12">
        <div className="text-center">
          <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-warm-cream">
            <Clock3 className="h-10 w-10 text-blue-accent" />
            <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber text-navy"><Sparkles className="h-4 w-4" /></span>
          </div>
          <p className="mt-8 text-[11px] font-semibold uppercase tracking-[.16em] text-blue-accent">Application received</p>
          <div>
            <h1 className="mx-auto mt-4 max-w-xl font-serif text-[clamp(2.4rem,5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-.04em] text-ink">Your investor profile is under review</h1>
            <p className="mx-auto mt-5 max-w-xl text-[15px] font-normal leading-7 text-ink/65">
              We&apos;ve received your information. You can continue exploring opportunities, and you&apos;ll gain access to full investment details once your profile has been approved.
            </p>
          </div>
          <Badge variant="pending" className="mt-5">Pending review</Badge>
        </div>

        <div className="mt-9 rounded-2xl border border-ink/10 bg-paper/55 p-5">
          <div className="mb-5 flex items-center gap-3 border-b border-ink/10 pb-4"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/25"><Check className="h-4 w-4 text-navy" /></span><div><p className="text-sm font-semibold text-ink">Application submitted</p><p className="mt-0.5 text-xs font-normal text-ink/50">Status: pending</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-warm-cream/55 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.10em] text-ink/45">LinkedIn URL</p>
            <p className="mt-2 break-all text-sm font-normal text-ink">{investor.linkedin_url ?? 'Not provided'}</p>
          </div>
          <div className="rounded-2xl bg-warm-cream/55 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.10em] text-ink/45">Cheque size</p>
            <p className="mt-2 text-sm font-normal text-ink">{investor.cheque_size ?? 'Not provided'}</p>
          </div>
          <div className="rounded-2xl bg-warm-cream/55 p-4 sm:col-span-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.10em] text-ink/45">Bio</p>
            <p className="mt-2 whitespace-pre-wrap text-sm font-normal text-ink">{investor.bio ?? 'Not provided'}</p>
          </div>
          <div className="rounded-2xl bg-warm-cream/55 p-4 sm:col-span-2">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.10em] text-ink/45">Location</p>
            <p className="mt-2 text-sm font-normal text-ink">{investor.location ?? 'Not provided'}</p>
          </div>
          </div>
        </div>

        <PendingActions />
      </Card>
    </div>
  )
}
