import { NextResponse } from 'next/server'
import { adminCookieOptions, ADMIN_SESSION_COOKIE, createAdminSessionCookieValue, verifyAdminPassword } from '@/lib/admin-auth'
import { PRIVATE_JSON_HEADERS, requireSameOrigin } from '@/lib/security'

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    const body = (await request.json().catch(() => ({}))) as { password?: string }

    if (!body.password || !verifyAdminPassword(body.password)) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const response = NextResponse.json({ ok: true }, { headers: PRIVATE_JSON_HEADERS })
    response.cookies.set(ADMIN_SESSION_COOKIE, createAdminSessionCookieValue(), adminCookieOptions())
    return response
  } catch {
    return NextResponse.json({ error: 'Admin login unavailable' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}
