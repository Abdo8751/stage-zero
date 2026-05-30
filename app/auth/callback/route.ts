import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { UserRole } from '@/lib/types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const roleParam = searchParams.get('role') as UserRole | null

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const supabase = createServerSupabaseClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const { data: existingUser } = await supabase
    .from('users')
    .select('role, is_verified')
    .eq('id', user.id)
    .maybeSingle()

  if (!existingUser && roleParam) {
    await supabase.from('users').insert({
      id: user.id,
      email: user.email ?? '',
      role: roleParam,
      full_name: (user.user_metadata.full_name as string | undefined) ?? null,
      avatar_url: (user.user_metadata.avatar_url as string | undefined) ?? null,
      is_verified: roleParam === 'founder',
    })

    if (roleParam === 'investor') {
      await supabase.from('investors').insert({
        user_id: user.id,
        verification_status: 'pending',
        credits: 3,
      })
    }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, is_verified')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    return NextResponse.redirect(`${origin}/signup`)
  }

  if (profile.role === 'founder') {
    const { data: startup } = await supabase
      .from('startups')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.redirect(`${origin}${startup ? '/dashboard' : '/onboarding'}`)
  }

  const { data: investor } = await supabase
    .from('investors')
    .select('verification_status')
    .eq('user_id', user.id)
    .maybeSingle()

  const approved = profile.is_verified && investor?.verification_status === 'approved'
  return NextResponse.redirect(`${origin}${approved ? '/browse' : '/investor/verify'}`)
}
