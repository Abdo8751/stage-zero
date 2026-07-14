'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export function AuthHashErrorRedirect() {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!window.location.hash.includes('error=')) return

    const params = new URLSearchParams(window.location.hash.slice(1))
    const errorCode = params.get('error_code')
    const error = params.get('error')

    if (error === 'access_denied' && (errorCode === 'otp_expired' || errorCode === 'otp_invalid')) {
      window.history.replaceState(null, '', pathname)
      router.replace('/forgot-password?error=expired_link')
    }
  }, [pathname, router])

  return null
}
