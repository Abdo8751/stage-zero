import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const roleParam = requestUrl.searchParams.get('role') as UserRole | null
  const origin = requestUrl.origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(`${origin}/login?error=server_config`)
  }

  // Build the redirect response first — cookies will be set on this response
  let redirectTo = `${origin}/login?error=auth`
  const cookiesToApply: { name: string; value: string; options?: Record<string, unknown> }[] = []

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Parse cookies from the incoming request
        const cookieHeader = request.headers.get('cookie') ?? ''
        return cookieHeader.split(';').filter(Boolean).map((c) => {
          const [name, ...rest] = c.trim().split('=')
          return { name, value: rest.join('=') }
        })
      },
      setAll(cookies) {
        // Collect cookies to apply to the outgoing response
        cookies.forEach((cookie) => {
          cookiesToApply.push(cookie)
        })
      },
    },
  })

  // Exchange the auth code for a session — this triggers setAll with session cookies
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession error:', exchangeError.message)
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  // Now get the user — session cookies are already stored in the client
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[auth/callback] No user after code exchange')
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  // Check if user has a profile row in public.users
  const { data: existingUser } = await supabase
    .from('users')
    .select('role, is_verified')
    .eq('id', user.id)
    .maybeSingle()

  // If no profile exists and we have a role from signup, create one using service key (bypasses RLS)
  if (!existingUser && roleParam) {
    const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const svc = svcKey ? createServiceClient(supabaseUrl, svcKey, { auth: { persistSession: false } }) : supabase

    const { error: insertError } = await svc.from('users').upsert({
      id: user.id,
      email: user.email ?? '',
      role: roleParam,
      full_name: (user.user_metadata.full_name as string | undefined) ?? null,
      avatar_url: (user.user_metadata.avatar_url as string | undefined) ?? null,
      is_verified: roleParam === 'founder',
      is_banned: false,
    }, { onConflict: 'id' })

    if (insertError) {
      console.error('[auth/callback] Failed to upsert user profile:', insertError.message)
    }

    if (roleParam === 'investor') {
      const { data: existingInv } = await svc.from('investors').select('id').eq('user_id', user.id).maybeSingle()
      if (!existingInv) {
        await svc.from('investors').insert({ user_id: user.id, verification_status: 'pending', credits: 0 })
      }
    }
  }

  // Re-fetch profile (may have just been created)
  const { data: profile } = await supabase
    .from('users')
    .select('role, is_verified')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    // No profile and no role param — send to signup to pick a role
    redirectTo = `${origin}/signup`
  } else if (profile.role === 'founder') {
    const { data: startup } = await supabase
      .from('startups')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    redirectTo = `${origin}${startup ? '/dashboard' : '/onboarding'}`
  } else {
    // Investor
    const { data: investor } = await supabase
      .from('investors')
      .select('verification_status')
      .eq('user_id', user.id)
      .maybeSingle()

    const approved = profile.is_verified && investor?.verification_status === 'approved'
    redirectTo = `${origin}${approved ? '/browse' : '/investor/verify'}`
  }

  // Create the redirect response and apply all session cookies to it
  const response = NextResponse.redirect(redirectTo)
  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Record<string, string>)
  })

  return response
}
