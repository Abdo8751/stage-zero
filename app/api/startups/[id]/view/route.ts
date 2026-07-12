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

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    requireSameOrigin(request)

    if (!UUID_RE.test(params.id)) {
      return NextResponse.json({ ok: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    const supabase = svc()
    const { data: startup, error: startupError } = await supabase
      .from('startups')
      .select('id')
      .eq('id', params.id)
      .eq('status', 'active')
      .eq('is_active', true)
      .maybeSingle()

    if (startupError || !startup) {
      return NextResponse.json({ ok: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    await supabase.rpc('increment_startup_view', { startup_id: params.id })
    return NextResponse.json({ ok: true }, { headers: PRIVATE_JSON_HEADERS })
  } catch {
    return NextResponse.json({ ok: true }, { headers: PRIVATE_JSON_HEADERS })
  }
}
