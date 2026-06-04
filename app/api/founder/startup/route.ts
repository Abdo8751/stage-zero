import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const token = authHeader.slice(7)
    const supabase = getServiceClient()

    // Verify the token and get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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
      return NextResponse.json({ error: startupError.message }, { status: 500 })
    }

    return NextResponse.json({ startup: startup ?? null })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch startup'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
