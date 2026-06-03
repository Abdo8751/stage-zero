import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { UserRole } from '@/lib/types'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth/reset-password', '/suspended']
const FOUNDER_ROUTES = ['/onboarding', '/dashboard', '/profile/edit', '/interests']
// Founders can access /browse and /startup/:id — they're blocked only from investor-only paths
const INVESTOR_ONLY_ROUTES = ['/saved', '/upgrade', '/investor/verify']
const INVESTOR_ROUTES = ['/browse', '/saved', '/upgrade', '/investor/verify']
const SHARED_ROUTES = ['/chat', '/notifications', '/settings', '/explore']

function matchesRoute(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
}

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  if (anonKey.startsWith('sb_secret_') || anonKey.includes('service_role')) return null
  return { url, anonKey }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  // Admin routes — simple cookie-based auth, separate from Supabase
  if (pathname.startsWith('/admin')) {
    const isAdminLogin = pathname === '/admin/login'
    const hasAdminAuth = request.cookies.get('admin_auth')?.value === 'true'

    if (!hasAdminAuth && !isAdminLogin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    if (hasAdminAuth && isAdminLogin) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }

    // Admin routes don't need Supabase session checks
    return supabaseResponse
  }

  const env = getSupabaseEnv()
  if (!env) {
    return supabaseResponse
  }

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = PUBLIC_ROUTES.includes(pathname)
  const isFounderRoute = matchesRoute(pathname, FOUNDER_ROUTES)
  const isInvestorRoute =
    matchesRoute(pathname, INVESTOR_ROUTES) || pathname.startsWith('/startup/')
  const isSharedRoute = matchesRoute(pathname, SHARED_ROUTES)
  const isProtected = isFounderRoute || isInvestorRoute || isSharedRoute
  const isInvestorOnly = matchesRoute(pathname, INVESTOR_ONLY_ROUTES)

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role, is_verified, is_banned')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      return supabaseResponse
    }

    if (profile) {
      // ── Banned user ──────────────────────────────────────────
      if ((profile as any).is_banned) {
        const url = request.nextUrl.clone()
        url.pathname = '/suspended'
        return NextResponse.redirect(url)
      }

      let investorApproved = profile.is_verified

      if (profile.role === 'investor') {
        const { data: investor } = await supabase
          .from('investors')
          .select('verification_status')
          .eq('user_id', user.id)
          .maybeSingle()

        investorApproved =
          profile.is_verified && investor?.verification_status === 'approved'
      }

      // Founders can browse startups — only block investor-only management routes
      if (profile.role === 'founder' && matchesRoute(pathname, INVESTOR_ONLY_ROUTES)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      if (profile.role === 'investor' && isFounderRoute) {
        const url = request.nextUrl.clone()
        url.pathname = investorApproved ? '/browse' : '/investor/verify'
        return NextResponse.redirect(url)
      }

      if (
        profile.role === 'investor' &&
        (pathname === '/browse' || pathname.startsWith('/startup/') || pathname === '/saved') &&
        !investorApproved
      ) {
        const url = request.nextUrl.clone()
        url.pathname = '/investor/verify'
        return NextResponse.redirect(url)
      }

      if (isPublic && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone()
        if (profile.role === 'founder') {
          const { data: startup } = await supabase
            .from('startups')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()
          url.pathname = startup ? '/dashboard' : '/onboarding'
        } else {
          url.pathname = investorApproved ? '/browse' : '/investor/verify'
        }
        return NextResponse.redirect(url)
      }
    } else if (isProtected && pathname !== '/signup') {
      // Authenticated but no profile — allow onboarding paths
      if (!pathname.startsWith('/onboarding') && pathname !== '/investor/verify') {
        const url = request.nextUrl.clone()
        url.pathname = '/signup'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/auth/reset-password',
    '/onboarding/:path*',
    '/dashboard/:path*',
    '/profile/:path*',
    '/interests/:path*',
    '/browse/:path*',
    '/saved/:path*',
    '/upgrade/:path*',
    '/investor/:path*',
    '/startup/:path*',
    '/chat/:path*',
    '/notifications/:path*',
    '/settings/:path*',
    '/explore/:path*',
    '/admin/:path*',
    '/admin',
  ],
}
