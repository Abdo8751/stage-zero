import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'
import { getInvestorRoute } from '@/lib/auth'

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
      return NextResponse.json({ error: 'Role update failed' }, { status: 500 })
    }

    // Ensure an investor row exists when switching to investor
    let investorStatus: 'draft' | 'pending' | 'approved' | 'rejected' | null = null

    if (newRole === 'investor') {
      const { data: existing } = await supabase
        .from('investors')
        .select('id, verification_status')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await supabase
          .from('investors')
          .upsert({ user_id: user.id, verification_status: 'draft', credits: 0 }, { onConflict: 'user_id' })
        investorStatus = 'draft'
      } else {
        investorStatus = existing.verification_status
      }
    }

    return NextResponse.json({
      success: true,
      newRole,
      nextRoute: newRole === 'founder' ? '/dashboard' : getInvestorRoute(investorStatus),
    })
  } catch {
    return NextResponse.json({ error: 'Role switch failed' }, { status: 500 })
  }
}
