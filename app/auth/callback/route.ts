import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { UserRole } from '@/lib/types'
import { finalizeProfileForUser } from '@/lib/profile-finalization'

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

  let redirectTo = `${origin}/login?error=auth`
  const cookiesToApply: { name: string; value: string; options?: Record<string, unknown> }[] = []

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const cookieHeader = request.headers.get('cookie') ?? ''
        return cookieHeader.split(';').filter(Boolean).map((cookie) => {
          const [name, ...rest] = cookie.trim().split('=')
          return { name, value: rest.join('=') }
        })
      },
      setAll(cookies) {
        cookies.forEach((cookie) => cookiesToApply.push(cookie))
      },
    },
  })

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession error:', exchangeError.message)
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.error('[auth/callback] No user after code exchange')
    return NextResponse.redirect(`${origin}/login?error=no_user`)
  }

  try {
    const result = await finalizeProfileForUser(user, roleParam)
    redirectTo = `${origin}${result.nextRoute}`
  } catch (err) {
    console.error('[auth/callback] finalizeProfileForUser error:', err instanceof Error ? err.message : err)
    redirectTo = `${origin}/signup`
  }

  const response = NextResponse.redirect(redirectTo)
  cookiesToApply.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Record<string, string>)
  })

  return response
}

