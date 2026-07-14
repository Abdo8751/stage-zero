import { NextResponse } from 'next/server'
import { getInvestorProfileForUserId } from '@/lib/investor'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PRIVATE_JSON_HEADERS } from '@/lib/security'

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
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }

    const investor = await getInvestorProfileForUserId(user.id)
    return NextResponse.json({ investor }, { headers: PRIVATE_JSON_HEADERS })
  } catch (err) {
    return NextResponse.json({ error: 'Investor profile lookup failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}
