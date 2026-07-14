import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PRIVATE_JSON_HEADERS } from '@/lib/security'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const token = authHeader.slice(7)
    const supabase = getServiceClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
    const linkedinUrl = cleanText(body.linkedin_url, 300)
    const bio = cleanText(body.bio, 2000)
    const chequeSize = cleanText(body.cheque_size, 100)
    const location = cleanText(body.location, 120)

    if (!linkedinUrl || !isHttpUrl(linkedinUrl) || !bio || !chequeSize || !location) {
      return NextResponse.json({ error: 'Invalid investor application' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
    }

    const payload = {
      user_id: user.id,
      linkedin_url: linkedinUrl,
      bio,
      cheque_size: chequeSize,
      location,
      verification_status: 'pending' as const,
    }

    const { data: existingInvestor, error: lookupError } = await supabase
      .from('investors')
      .select('id, credits')
      .eq('user_id', user.id)
      .maybeSingle()

    if (lookupError) {
      return NextResponse.json({ error: 'Investor lookup failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
    }

    const credits = existingInvestor?.credits ?? 0

    const { error: upsertError } = await supabase
      .from('investors')
      .upsert({ ...payload, credits }, { onConflict: 'user_id' })

    if (upsertError) {
      return NextResponse.json({ error: 'Investor application update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
    }

    return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
  } catch (err) {
    return NextResponse.json({ error: 'Submit failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}

