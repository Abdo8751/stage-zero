import { NextResponse } from 'next/server'
import { getInvestorProfileForUserId } from '@/lib/investor'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = bearerToken ? await supabase.auth.getUser(bearerToken) : await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const investor = await getInvestorProfileForUserId(user.id)
    return NextResponse.json({ investor })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Investor profile lookup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
