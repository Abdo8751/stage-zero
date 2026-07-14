import { NextResponse } from 'next/server'
import { adminCookieOptions, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth'
import { PRIVATE_JSON_HEADERS, requireSameOrigin } from '@/lib/security'

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
  } catch {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403, headers: PRIVATE_JSON_HEADERS })
  }

  const response = NextResponse.json({ ok: true }, { headers: PRIVATE_JSON_HEADERS })
  response.cookies.set(ADMIN_SESSION_COOKIE, '', { ...adminCookieOptions(), maxAge: 0 })
  return response
}
