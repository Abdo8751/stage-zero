'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export function PendingActions() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/investor/verify?edit=1"
          className="inline-flex w-full items-center justify-center rounded-full border border-blue-accent bg-blue-accent px-5 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_rgba(75,124,246,.20)] transition hover:border-blue-bright hover:bg-blue-bright"
        >
          Edit application
        </Link>
        <Link
          href="/browse"
          className="inline-flex w-full items-center justify-center rounded-full border border-ink/15 bg-paper px-5 py-3 text-[14px] font-semibold text-ink transition hover:border-ink/25 hover:bg-warm-cream"
        >
          Back to opportunities
        </Link>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-5 text-[13px] text-ink/55 transition-colors hover:text-ink"
      >
        Sign out
      </button>
    </>
  )
}
