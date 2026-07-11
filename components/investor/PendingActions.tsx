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
          className="inline-flex w-full items-center justify-center rounded-btn border border-[rgba(255,255,255,0.18)] bg-[#040B1A] px-5 py-3 text-[14px] font-black tracking-[-0.02em] text-white shadow-[0_0_0_1px_rgba(240,230,208,0.10)_inset,0_6px_24px_rgba(0,0,0,0.65),0_1px_0_rgba(255,255,255,0.18)_inset] transition-all duration-150 hover:border-[rgba(240,218,150,0.50)] hover:bg-[#061228] hover:shadow-[0_0_28px_rgba(240,218,150,0.28),0_6px_24px_rgba(0,0,0,0.60)]"
        >
          Edit application
        </Link>
        <Link
          href="/browse"
          className="inline-flex w-full items-center justify-center rounded-btn border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)] px-5 py-3 text-[14px] font-black tracking-[-0.02em] text-white shadow-[0_1px_0_rgba(255,255,255,0.20)_inset,0_4px_16px_rgba(0,0,0,0.30)] transition-all duration-150 hover:bg-[rgba(255,255,255,0.20)] hover:border-[rgba(255,255,255,0.55)] hover:shadow-[0_1px_0_rgba(255,255,255,0.28)_inset,0_6px_20px_rgba(0,0,0,0.28)]"
        >
          Back to opportunities
        </Link>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        className="mt-5 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
      >
        Sign out
      </button>
    </>
  )
}
