import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const supabase = getServiceClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = (await request.json()) as {
      linkedin_url: string
      bio: string
      cheque_size: string
      location: string
    }

    const payload = {
      user_id: user.id,
      linkedin_url: body.linkedin_url.trim(),
      bio: body.bio.trim(),
      cheque_size: body.cheque_size.trim(),
      location: body.location.trim(),
      verification_status: 'pending' as const,
    }

    const { data: existingInvestor, error: lookupError } = await supabase
      .from('investors')
      .select('id, credits')
      .eq('user_id', user.id)
      .maybeSingle()

    if (lookupError) {
      return NextResponse.json({ error: lookupError.message }, { status: 500 })
    }

    const credits = existingInvestor?.credits ?? 0

    const { error: upsertError } = await supabase
      .from('investors')
      .upsert({ ...payload, credits }, { onConflict: 'user_id' })

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Submit failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

