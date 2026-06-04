import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'

function getServiceClient() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
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

    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = (await request.json()) as { newRole: UserRole }
    const { newRole } = body

    if (newRole !== 'founder' && newRole !== 'investor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const isVerified = newRole === 'founder'

    // Update role + is_verified in public.users
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: newRole, is_verified: isVerified })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Ensure an investor row exists when switching to investor
    if (newRole === 'investor') {
      const { data: existing } = await supabase
        .from('investors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await supabase
          .from('investors')
          .insert({ user_id: user.id, verification_status: 'pending', credits: 0 })
      }
    }

    return NextResponse.json({ success: true, newRole })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Switch failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
