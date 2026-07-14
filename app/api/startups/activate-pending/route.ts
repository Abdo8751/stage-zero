import { NextResponse } from 'next/server'
import { PRIVATE_JSON_HEADERS } from '@/lib/security'

export async function POST() {
  return NextResponse.json(
    { error: 'Startup activation is handled by admin review.' },
    { status: 410, headers: PRIVATE_JSON_HEADERS },
  )
}
