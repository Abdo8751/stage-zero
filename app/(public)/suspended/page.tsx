import Link from 'next/link'
import { ShieldOff } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function SuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5">
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(255,69,58,0.10)] border border-[rgba(255,69,58,0.25)]">
          <ShieldOff className="h-6 w-6 text-[#FF453A]" />
        </div>
        <h1 className="text-[24px] font-black tracking-tight text-cream">Account suspended</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-cream-muted">
          Your account has been suspended for violating Stage Zero&apos;s terms of service. If you believe this is a mistake, please contact us.
        </p>
        <Link href="mailto:support@stagezero.eg" className="mt-6 block">
          <Button variant="secondary" fullWidth>Contact support</Button>
        </Link>
        <Link href="/login" className="mt-3 block text-[13px] text-cream-subtle hover:text-cream transition-colors">
          Back to login
        </Link>
      </Card>
    </div>
  )
}
