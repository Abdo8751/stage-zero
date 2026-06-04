'use client'

import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { ArrowLeft } from 'lucide-react'

const PACKS = [
  { name: '5 intros', price: '3,000 EGP', credits: 5, url: 'https://paymob.com/placeholder-5' },
  { name: '15 intros', price: '7,500 EGP', credits: 15, url: 'https://paymob.com/placeholder-15' },
]

const MONTHLY = {
  name: 'Monthly plan',
  price: '1,200 EGP/month',
  credits: 5,
  url: 'https://paymob.com/placeholder-monthly',
}

export default function UpgradePage() {
  const router = useRouter()
  const { investor, loading } = useUser()
  const { showToast } = useToast()

  if (loading) return <div className="py-16 text-center text-muted">Loading…</div>

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:py-12">
      <button
        type="button"
        onClick={() => router.push('/browse')}
        className="mb-5 flex items-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to browse
      </button>
      <h1 className="text-3xl sm:text-4xl">Upgrade</h1>
      <p className="mt-2 text-muted">Purchase intro credits to connect with founders</p>

      <Card className="mt-8 text-center">
        <p className="text-sm text-muted">Current credits</p>
        <p className="font-heading text-5xl text-gold">{investor?.credits ?? 0}</p>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {PACKS.map((pack) => (
          <Card key={pack.name}>
            <h2 className="text-xl">{pack.name}</h2>
            <p className="mt-2 font-heading text-2xl text-navy">{pack.price}</p>
            <p className="mt-1 text-sm text-muted">{pack.credits} intro credits</p>
            <Button
              className="mt-6"
              fullWidth
              onClick={() => {
                showToast('Redirecting to payment…', 'info')
                window.open(pack.url, '_blank')
              }}
            >
              Purchase
            </Button>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <h2 className="text-xl">{MONTHLY.name}</h2>
        <p className="mt-2 font-heading text-2xl text-navy">{MONTHLY.price}</p>
        <p className="mt-1 text-sm text-muted">5 credits renewed monthly</p>
        <Button
          className="mt-6"
          variant="secondary"
          fullWidth
          onClick={() => {
            showToast('Redirecting to payment…', 'info')
            window.open(MONTHLY.url, '_blank')
          }}
        >
          Subscribe
        </Button>
      </Card>
    </div>
  )
}
