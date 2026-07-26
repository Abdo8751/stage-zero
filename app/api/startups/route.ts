import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRIVATE_JSON_HEADERS } from '@/lib/security'

function svc() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const stage  = searchParams.get('stage')
    const sector = searchParams.get('sector')
    const minR   = searchParams.get('minRaise')
    const maxR   = searchParams.get('maxRaise')

    const supabase = svc()

    let query = supabase
      .from('startups')
      .select('id, name, tagline, sector, stage, raise_amount, website_url, logo_url, description, is_featured, created_at')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (stage) query = query.eq('stage', stage)
    if (minR)  query = query.gte('raise_amount', parseInt(minR, 10))
    if (maxR)  query = query.lte('raise_amount', parseInt(maxR, 10))

    const { data, error } = await query
    if (error) return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

    return NextResponse.json({ data: data ?? [] }, { headers: PRIVATE_JSON_HEADERS })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch startups' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}
