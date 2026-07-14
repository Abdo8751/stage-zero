import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRIVATE_JSON_HEADERS, requireSameOrigin } from '@/lib/security'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function svc() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get('Authorization')
  return authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)

    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const body = (await request.json().catch(() => null)) as { startupId?: string } | null
    const startupId = body?.startupId
    if (!startupId || !UUID_RE.test(startupId)) {
      return NextResponse.json({ error: 'Unable to express interest' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
    }

    const supabase = svc()
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const { data, error } = await supabase
      .rpc('express_investor_interest', {
        target_startup_id: startupId,
        target_user_id: user.id,
      })
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Unable to express interest' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
    }

    const result = data as { match_id: string; credits_remaining: number; already_exists: boolean }
    return NextResponse.json(
      {
        matchId: result.match_id,
        creditsRemaining: result.credits_remaining,
        alreadyExists: result.already_exists,
      },
      { headers: PRIVATE_JSON_HEADERS },
    )
  } catch {
    return NextResponse.json({ error: 'Unable to express interest' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}
