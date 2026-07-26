import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <Link href="/" aria-label="Stage Zero home" className={`inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-[-.04em] text-ink ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber text-navy">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
      </span>
      Stage Zero
    </Link>
  )
}
