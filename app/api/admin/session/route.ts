import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin-auth'
import { PRIVATE_JSON_HEADERS } from '@/lib/security'

export async function GET() {
  try {
    requireAdminSession()
    return NextResponse.json({ authenticated: true }, { headers: PRIVATE_JSON_HEADERS })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401, headers: PRIVATE_JSON_HEADERS })
  }
}
