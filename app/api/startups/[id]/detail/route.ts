import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRIVATE_JSON_HEADERS } from '@/lib/security'

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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    if (!UUID_RE.test(params.id)) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404, headers: PRIVATE_JSON_HEADERS })
    }

    const token = getBearerToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const supabase = svc()
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const { data: investor, error: investorError } = await supabase
      .from('investors')
      .select('id, verification_status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (investorError) {
      return NextResponse.json({ error: 'Unable to load startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
    }

    if (investor?.verification_status !== 'approved') {
      return NextResponse.json({ error: 'Investor approval required' }, { status: 403, headers: PRIVATE_JSON_HEADERS })
    }

    const { data: startup, error: startupError } = await supabase
      .from('startups')
      .select(`
        id,
        user_id,
        name,
        tagline,
        sector,
        stage,
        status,
        problem,
        solution,
        raise_amount,
        pitch_deck_url,
        website_url,
        traction,
        is_active,
        is_featured,
        view_count,
        created_at,
        users(full_name, avatar_url, email)
      `)
      .eq('id', params.id)
      .eq('status', 'active')
      .eq('is_active', true)
      .maybeSingle()

    if (startupError) {
      return NextResponse.json({ error: 'Unable to load startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
    }

    if (!startup) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404, headers: PRIVATE_JSON_HEADERS })
    }

    if (startup.pitch_deck_url) {
      const { data: signedDeck, error: signedDeckError } = await supabase.storage
        .from('pitch-decks')
        .createSignedUrl(startup.pitch_deck_url, 10 * 60)
      if (signedDeckError) {
        return NextResponse.json({ error: 'Unable to load startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
      }
      startup.pitch_deck_url = signedDeck.signedUrl
    }

    return NextResponse.json({ startup }, { headers: PRIVATE_JSON_HEADERS })
  } catch {
    return NextResponse.json({ error: 'Unable to load startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}
