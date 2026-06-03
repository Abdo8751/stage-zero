import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'

interface SetupProfileBody {
  role: UserRole
  full_name?: string
  email?: string
}

function getServiceClient() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SetupProfileBody
    const { role, full_name, email } = body

    if (role !== 'founder' && role !== 'investor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Use service role key — bypasses RLS on all tables
    const supabase = getServiceClient()

    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null
    let userEmail: string | null = email ?? null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const { data: { user }, error } = await supabase.auth.getUser(token)
      if (error || !user) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      }
      userId = user.id
      userEmail = userEmail ?? user.email ?? ''
    } else {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Upsert the user row — only columns that exist in the original schema.
    // is_banned is intentionally omitted; the DB default (false) handles it.
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: userId,
        email: userEmail,
        role,
        full_name: full_name?.trim() ?? null,
        is_verified: role === 'founder',
      }, { onConflict: 'id' })

    if (userError) {
      // Return the exact Supabase message so it's visible in the UI
      return NextResponse.json(
        { error: `DB error: ${userError.message} (code: ${userError.code})` },
        { status: 400 },
      )
    }

    // Create investor row if needed
    if (role === 'investor') {
      const { data: existing } = await supabase
        .from('investors')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!existing) {
        const { error: investorError } = await supabase
          .from('investors')
          .insert({ user_id: userId, verification_status: 'pending', credits: 0 })

        if (investorError) {
          return NextResponse.json(
            { error: `Investor DB error: ${investorError.message} (code: ${investorError.code})` },
            { status: 400 },
          )
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Setup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
