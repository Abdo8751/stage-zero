import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getInvestorProtectedRoute, getInvestorRoute } from '@/lib/auth'
import { createServiceSupabaseClient } from '@/lib/investor'

const PUBLIC_ROUTES = ['/', '/login', '/signup', '/auth/reset-password', '/auth/verify-email', '/suspended', '/explore']
const FOUNDER_ROUTES = ['/onboarding', '/dashboard', '/profile/edit', '/interests']
// Founders can access /browse and /startup/:id — they're blocked only from investor-only paths
const INVESTOR_ONLY_ROUTES = ['/saved', '/upgrade', '/investor/verify', '/investor/pending']
const INVESTOR_ROUTES = ['/browse', '/saved', '/upgrade', '/investor/verify', '/investor/pending']
const SHARED_ROUTES = ['/chat', '/notifications', '/settings']

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

function devTrace(message: string, data?: Record<string, unknown>) {
  if (process.env.NODE_ENV === 'production') return
  if (data) {
    console.log(`[middleware] ${message}`, JSON.stringify(data))
  } else {
    console.log(`[middleware] ${message}`)
  }
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const pathname = request.nextUrl.pathname
  devTrace('request', { pathname })

  if (pathname.startsWith('/auth/callback')) {
    return supabaseResponse
  }

  // Admin routes + admin API routes — cookie-based auth, separate from Supabase
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isAdminLogin = pathname === '/admin/login'
    const isAdminApi   = pathname.startsWith('/api/admin')
    const hasAdminAuth = request.cookies.get('admin_auth')?.value === 'true'

    if (!hasAdminAuth && !isAdminLogin) {
      // API routes: return 401 JSON instead of redirect
      if (isAdminApi) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
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
  devTrace('auth', { pathname, userId: user?.id ?? null })

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

      let investorStatus: 'draft' | 'pending' | 'approved' | 'rejected' | null = null

      if (profile.role === 'investor') {
        const serviceSupabase = createServiceSupabaseClient()
        const { data: investor, error: investorError } = await serviceSupabase
          .from('investors')
          .select('verification_status')
          .eq('user_id', user.id)
          .maybeSingle()

        if (investorError) {
          devTrace('investor_lookup_error', {
            pathname,
            userId: user.id,
            source: 'middleware:/startup/[id]',
            error: investorError.message,
          })
        } else {
          devTrace('investor_lookup_ok', {
            pathname,
            userId: user.id,
            source: 'middleware:/startup/[id]',
            investorRowFound: Boolean(investor),
            verificationStatus: investor?.verification_status ?? null,
          })
        }
        investorStatus = investor?.verification_status ?? null
      }

      // Founders can browse startups — only block investor-only management routes
      if (profile.role === 'founder' && matchesRoute(pathname, INVESTOR_ONLY_ROUTES)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      if (profile.role === 'investor' && isFounderRoute) {
        const url = request.nextUrl.clone()
        url.pathname = getInvestorRoute(investorStatus)
        return NextResponse.redirect(url)
      }

      if (profile.role === 'investor' && pathname.startsWith('/startup/')) {
        if (investorStatus === 'approved') {
          devTrace('redirect', {
            pathname,
            userId: user.id,
            source: 'middleware:/startup/[id]',
            destination: pathname,
            verificationStatus: 'approved',
          })
          return supabaseResponse
        }

        const nextRoute = getInvestorProtectedRoute(investorStatus) ?? '/investor/verify'
        devTrace('redirect', {
          pathname,
          userId: user.id,
          source: 'middleware:/startup/[id]',
          destination: nextRoute,
          verificationStatus: investorStatus,
        })
        const url = request.nextUrl.clone()
        url.pathname = nextRoute
        url.search = ''
        if (nextRoute.includes('?')) {
          const [redirectPath, search] = nextRoute.split('?')
          url.pathname = redirectPath
          url.search = search
        }
        return NextResponse.redirect(url)
      }

      if (isPublic && (pathname === '/login' || pathname === '/signup')) {
        const url = request.nextUrl.clone()
        if (profile.role === 'founder') {
          // Always send founders to /dashboard — it handles both has-startup and no-startup states
          // (Avoid a startup DB lookup here because RLS blocks pending/inactive startups on the anon key)
          url.pathname = '/dashboard'
        } else {
          const investorRoute = getInvestorRoute(investorStatus)
          if (investorRoute.includes('?')) {
            const [redirectPath, search] = investorRoute.split('?')
            url.pathname = redirectPath
            url.search = search
          } else {
            url.pathname = investorRoute
            url.search = ''
          }
        }
        return NextResponse.redirect(url)
      }
    } else if (isProtected && pathname !== '/signup') {
      // Authenticated but no profile — allow onboarding paths
      if (!pathname.startsWith('/onboarding') && pathname !== '/investor/verify' && pathname !== '/investor/pending') {
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
    '/auth/verify-email',
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
    '/api/admin/:path*',
  ],
}
