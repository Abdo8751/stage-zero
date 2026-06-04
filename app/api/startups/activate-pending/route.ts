import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/startups/activate-pending
 * Activates all pending_review startups that have raise_amount set
 * (i.e. completed full onboarding). Called automatically by the browse page
 * on first load so founders never need to run SQL.
 */
export async function POST() {
  try {
    const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !svcKey) return NextResponse.json({ skipped: true })

    const supabase = createClient(url, svcKey, { auth: { persistSession: false } })

    // Only activate startups that completed full onboarding (have a raise_amount)
    const { data, error } = await supabase
      .from('startups')
      .update({ status: 'active', is_active: true })
      .eq('status', 'pending_review')
      .not('raise_amount', 'is', null)
      .select('id, name')

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ activated: (data ?? []).length, startups: data })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 })
  }
}
