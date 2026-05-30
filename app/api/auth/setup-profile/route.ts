import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { UserRole } from '@/lib/types'

interface SetupProfileBody {
  role: UserRole
  email?: string
}

export async function POST(request: Request) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = (await request.json()) as SetupProfileBody
    const role = body.role

    if (role !== 'founder' && role !== 'investor') {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, existing: true })
    }

    const { error: userError } = await supabase.from('users').insert({
      id: user.id,
      email: body.email ?? user.email ?? '',
      role,
      is_verified: role === 'founder',
    })

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    if (role === 'investor') {
      const { error: investorError } = await supabase.from('investors').insert({
        user_id: user.id,
        verification_status: 'pending',
        credits: 3,
      })

      if (investorError) {
        return NextResponse.json({ error: investorError.message }, { status: 400 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Setup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
