import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'
import { finalizeProfileForUser } from '@/lib/profile-finalization'

interface SetupProfileBody {
  role?: UserRole
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as SetupProfileBody
    const { role } = body

    if (role !== undefined && role !== 'founder' && role !== 'investor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const supabase = getServiceClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const result = await finalizeProfileForUser(user, role)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Setup failed'
    const emailNotConfirmed = /not confirmed/i.test(message)
    return NextResponse.json(
      { error: emailNotConfirmed ? 'Email not confirmed' : 'Profile setup failed' },
      { status: emailNotConfirmed ? 403 : 500 },
    )
  }
}

