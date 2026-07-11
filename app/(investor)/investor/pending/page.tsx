import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft } from 'lucide-react'
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
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <Link
        href="/browse"
        className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to opportunities
      </Link>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl text-text-primary">Your investor profile is under review</h1>
            <p className="mt-2 text-text-secondary font-body font-light">
              We&apos;ve received your information. You can continue exploring opportunities, and you&apos;ll gain access to full investment details once your profile has been approved.
            </p>
          </div>
          <Badge variant="pending">Pending review</Badge>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-[rgba(240,230,208,0.08)] bg-[rgba(240,228,200,0.04)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-text-secondary">LinkedIn URL</p>
            <p className="mt-2 text-sm text-text-primary break-all">{investor.linkedin_url ?? 'Not provided'}</p>
          </div>
          <div className="rounded-card border border-[rgba(240,230,208,0.08)] bg-[rgba(240,228,200,0.04)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-text-secondary">Cheque size</p>
            <p className="mt-2 text-sm text-text-primary">{investor.cheque_size ?? 'Not provided'}</p>
          </div>
          <div className="rounded-card border border-[rgba(240,230,208,0.08)] bg-[rgba(240,228,200,0.04)] p-4 sm:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-text-secondary">Bio</p>
            <p className="mt-2 text-sm text-text-primary whitespace-pre-wrap">{investor.bio ?? 'Not provided'}</p>
          </div>
          <div className="rounded-card border border-[rgba(240,230,208,0.08)] bg-[rgba(240,228,200,0.04)] p-4 sm:col-span-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-text-secondary">Location</p>
            <p className="mt-2 text-sm text-text-primary">{investor.location ?? 'Not provided'}</p>
          </div>
        </div>

        <PendingActions />
      </Card>
    </div>
  )
}
