import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'
import { finalizeProfileForUser } from '@/lib/profile-finalization'
import { createServerSupabaseClient } from '@/lib/supabase-server'

interface FinalizeProfileBody {
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
    const body = (await request.json().catch(() => ({}))) as FinalizeProfileBody
    const role = body.role

    if (role !== undefined && role !== 'founder' && role !== 'investor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const supabase = bearerToken ? getServiceClient() : createServerSupabaseClient()
    const {
      data: { user },
      error: userError,
    } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const result = await finalizeProfileForUser(user, role)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Profile finalization failed'
    const status = /not confirmed/i.test(message) ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
