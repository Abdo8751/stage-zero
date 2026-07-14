import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRIVATE_JSON_HEADERS, requireSameOrigin } from '@/lib/security'

function getServiceClient() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const token = authHeader.slice(7)
    const supabase = getServiceClient()

    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    // Fetch startup using service role — bypasses RLS so pending/inactive startups are visible to their owner
    const { data: startup, error: startupError } = await supabase
      .from('startups')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (startupError) {
      return NextResponse.json({ error: 'Failed to fetch startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
    }

    return NextResponse.json({ startup: startup ?? null }, { headers: PRIVATE_JSON_HEADERS })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function cleanStringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems)
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request)

    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const token = authHeader.slice(7)
    const supabase = getServiceClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body.id !== 'string') {
      return NextResponse.json({ error: 'Invalid startup update' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
    }

    const { data: existing, error: existingError } = await supabase
      .from('startups')
      .select('id, user_id, status')
      .eq('id', body.id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingError) {
      return NextResponse.json({ error: 'Failed to update startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
    }

    if (!existing) {
      return NextResponse.json({ error: 'Startup not found' }, { status: 404, headers: PRIVATE_JSON_HEADERS })
    }

    const raiseAmount = typeof body.raise_amount === 'number' && Number.isFinite(body.raise_amount)
      ? Math.max(0, Math.floor(body.raise_amount))
      : null

    const update: Record<string, unknown> = {
      name: cleanText(body.name, 120),
      tagline: cleanText(body.tagline, 180),
      sector: cleanStringArray(body.sector, 8, 80),
      stage: cleanText(body.stage, 40),
      problem: cleanText(body.problem, 4000),
      solution: cleanText(body.solution, 4000),
      raise_amount: raiseAmount,
      website_url: cleanText(body.website_url, 500),
      traction: cleanText(body.traction, 4000),
      pitch_deck_url: cleanText(body.pitch_deck_url, 1000),
    }

    if (existing.status === 'rejected' || existing.status === 'changes_requested') {
      update.status = 'pending_review'
      update.is_active = false
      update.rejection_reason = null
    }

    const { error: updateError } = await supabase
      .from('startups')
      .update(update)
      .eq('id', existing.id)
      .eq('user_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
    }

    return NextResponse.json({ ok: true }, { headers: PRIVATE_JSON_HEADERS })
  } catch {
    return NextResponse.json({ error: 'Failed to update startup' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}
