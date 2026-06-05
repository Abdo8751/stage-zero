'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { getNotifications } from '@/lib/auth'
import {
  Bell, Menu, X, LogOut, Settings,
  LayoutDashboard, Compass, MessageSquare,
  Inbox, BookmarkIcon, Search, Zap, RefreshCw,
} from 'lucide-react'

type NavLink = { href: string; label: string; icon: React.ElementType; badge?: boolean }

/* ── Route definitions (trimmed to 4 core links per role) ── */
const founderLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/explore',   label: 'Explore',   icon: Compass },
  { href: '/interests', label: 'Inbox',     icon: Inbox,          badge: true },
  { href: '/chat',      label: 'Chat',      icon: MessageSquare },
]

const investorLinks: NavLink[] = [
  { href: '/browse',    label: 'Browse',    icon: Search },
  { href: '/explore',   label: 'Explore',   icon: Compass },
  { href: '/saved',     label: 'Saved',     icon: BookmarkIcon },
  { href: '/chat',      label: 'Chat',      icon: MessageSquare },
]

/* ── Avatar ─────────────────────────────────────────────── */
function Avatar({ name, size = 'sm' }: { name: string | null; size?: 'sm' | 'md' }) {
  const initials = (name ?? '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const dim = size === 'md' ? 'h-10 w-10 text-[14px]' : 'h-7 w-7 text-[11px]'
  return (
    <div className={`${dim} shrink-0 rounded-full bg-gradient-to-b from-[#F5EDDB] to-[#D5C8A8] flex items-center justify-center font-black text-navy shadow-[0_1px_4px_rgba(0,0,0,0.3)]`}>
      {initials}
    </div>
  )
}

export function Navbar() {
  const pathname       = usePathname()
  const router         = useRouter()
  const { user, loading } = useUser()
  const [mobileOpen,   setMobileOpen]   = useState(false)
  const [unreadCount,  setUnreadCount]  = useState(0)
  const [pendingCount, setPendingCount] = useState(0)

  /* Unread notification count (localStorage) — #1 Visibility of System Status */
  useEffect(() => {
    setUnreadCount(getNotifications().filter((n) => !n.is_read).length)
  }, [pathname])

  /* Pending inbox count for founders — lightweight count query */
  useEffect(() => {
    if (!user || user.role !== 'founder') return
    const run = async () => {
      const supabase = createClient()
      const { data: startup } = await supabase
        .from('startups').select('id').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(1).maybeSingle()
      if (!startup) return
      const { count } = await supabase
        .from('matches').select('id', { count: 'exact', head: true })
        .eq('startup_id', startup.id).eq('status', 'pending')
      setPendingCount(count ?? 0)
    }
    void run()
  }, [user, pathname])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const links = user?.role === 'founder' ? founderLinks
    : user?.role === 'investor'          ? investorLinks
    : []

  const isAuthPage = pathname === '/login' || pathname === '/signup'
  if (pathname.startsWith('/admin')) return null

  const firstName = user?.full_name?.split(' ')[0] ?? 'You'

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-5 lg:px-8">
        {/* Glass background — dark, opaque, strong cream border */}
        <div className="absolute inset-0 bg-[rgba(4,11,26,0.92)] backdrop-blur-[60px] border-b-2 border-[rgba(255,255,255,0.12)]" />
        {/* Subtle cream glow along bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(240,218,150,0.40)] to-transparent" />

        {/* ── Logo ──────────────────────────────────── */}
        <Link href="/" className="relative z-10 shrink-0 select-none mr-8">
          <span
            className="text-[20px] font-black tracking-[-0.05em] text-white uppercase"
            style={{ textShadow: '0 0 24px rgba(240,218,150,0.45)' }}
          >
            STAGE ZERO
          </span>
        </Link>

        {/* ── Desktop nav ──────────────────────────── */}
        <div className="relative z-10 hidden flex-1 items-center justify-between lg:flex">

          {/* Primary nav links */}
          {user && !loading && (
            <nav className="flex items-center gap-1">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                const count    = link.badge ? pendingCount : 0
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`
                      relative flex items-center gap-2 px-4 py-2 rounded-[10px]
                      text-[13px] font-bold tracking-[-0.01em] transition-all duration-150
                      ${isActive
                        ? 'bg-white text-[#040B1A] shadow-[0_2px_12px_rgba(0,0,0,0.25)]'
                        : 'text-[rgba(255,255,255,0.62)] hover:text-white hover:bg-[rgba(255,255,255,0.10)]'
                      }
                    `}
                  >
                    <link.icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-[#040B1A]' : 'text-[rgba(255,255,255,0.45)]'}`} />
                    {link.label}
                    {count > 0 && (
                      <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF453A] text-[9px] font-black text-white px-1">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          )}

          {/* Loading skeleton */}
          {loading && (
            <div className="flex items-center gap-2">
              {[80, 68, 60, 52].map((w) => (
                <div key={w} className="shimmer h-8 rounded-[10px]" style={{ width: w }} />
              ))}
            </div>
          )}

          {/* Right section */}
          <div className="ml-auto flex items-center gap-3">

            {!user && !loading && !isAuthPage && (
              <Link
                href="/explore"
                className="text-[13px] font-bold text-[rgba(255,255,255,0.62)] hover:text-white transition-colors"
              >
                Explore startups
              </Link>
            )}

            {user && !loading ? (
              <>
                {/* Notification bell */}
                <Link
                  href="/notifications"
                  title="Notifications"
                  className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.25)] transition-all"
                >
                  <Bell className="h-4 w-4 text-[rgba(255,255,255,0.70)]" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF453A] text-[9px] font-black text-white px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User identity card */}
                <Link
                  href="/settings"
                  title="Profile & Settings"
                  className="group flex items-center gap-2.5 rounded-[12px] border border-[rgba(255,255,255,0.16)] bg-[rgba(255,255,255,0.08)] pl-2.5 pr-4 py-2 hover:bg-[rgba(255,255,255,0.14)] hover:border-[rgba(255,255,255,0.28)] transition-all duration-150"
                >
                  <Avatar name={user.full_name} />
                  <div className="leading-none">
                    <p className="text-[13px] font-black text-white">{firstName}</p>
                    <p className="mt-0.5 text-[10px] font-bold capitalize text-[rgba(255,255,255,0.45)]">
                      {user.role}
                    </p>
                  </div>
                </Link>

                {/* Sign out */}
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-bold text-[rgba(255,255,255,0.45)] hover:text-[#FF6B6B] hover:bg-[rgba(255,69,58,0.08)] transition-all duration-150 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden xl:inline">Sign out</span>
                </button>
              </>
            ) : (
              !loading && !isAuthPage && (
                <div className="flex items-center gap-3">
                  <a
                    href="https://instagram.com/stagezero.eg"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="@stagezero.eg on Instagram"
                    className="flex items-center justify-center text-[rgba(255,255,255,0.45)] hover:text-white transition-colors"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.7" fill="currentColor" stroke="none" />
                    </svg>
                  </a>
                  <Link href="/login" className="px-4 py-2 text-[13px] font-bold text-[rgba(255,255,255,0.62)] hover:text-white transition-colors">
                    Log in
                  </Link>
                  <Link href="/signup">
                    <Button size="sm">Get started</Button>
                  </Link>
                </div>
              )
            )}
          </div>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="relative z-10 ml-auto flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.14)] lg:hidden cursor-pointer hover:bg-[rgba(255,255,255,0.14)] transition-all"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-4 w-4 text-white" /> : <Menu className="h-4 w-4 text-white" />}
        </button>
      </header>

      {/* ── Mobile drawer ─────────────────────────── */}
      {mobileOpen && (
        <div className="fixed top-16 inset-x-0 z-40 flex flex-col border-b-2 border-[rgba(255,255,255,0.10)] bg-[rgba(4,11,26,0.97)] backdrop-blur-[60px] lg:hidden">
          {loading ? (
            <div className="space-y-2 p-5">
              {[1, 2, 3].map((i) => <div key={i} className="shimmer h-10 rounded-[10px]" />)}
            </div>
          ) : user ? (
            <>
              {/* User identity at top — #6 Recognition Rather than Recall */}
              <div className="flex items-center justify-between gap-3 border-b border-[rgba(240,230,208,0.07)] px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={user.full_name} size="md" />
                  <div>
                    <p className="text-[15px] font-bold text-cream">{user.full_name ?? 'You'}</p>
                    <p className="text-[12px] capitalize text-cream-subtle">{user.role} · {user.email}</p>
                  </div>
                </div>
                <Link href="/notifications" onClick={() => setMobileOpen(false)} className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-glass-border bg-[rgba(240,230,208,0.04)]">
                  <Bell className="h-4 w-4 text-cream-muted" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#FF453A] text-[9px] font-black text-white px-0.5">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
              </div>

              {/* Nav links */}
              <nav className="flex flex-col gap-1 px-4 py-3">
                {links.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
                  const count    = link.badge ? pendingCount : 0
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-[10px] px-4 py-3 text-[14px] font-medium transition-colors ${
                        isActive ? 'bg-[rgba(240,230,208,0.09)] text-cream' : 'text-cream-muted hover:text-cream hover:bg-[rgba(240,230,208,0.04)]'
                      }`}
                    >
                      <link.icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-cream' : 'text-cream-subtle'}`} />
                      <span className="flex-1">{link.label}</span>
                      {count > 0 && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#FF453A] text-[10px] font-black text-white px-1">
                          {count > 9 ? '9+' : count}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Bottom section */}
              <div className="flex flex-col gap-1 border-t border-[rgba(240,230,208,0.07)] px-4 py-3">
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-[14px] font-medium text-cream-muted hover:text-cream hover:bg-[rgba(240,230,208,0.04)] transition-colors"
                >
                  <Settings className="h-4 w-4 text-cream-subtle" />
                  Settings
                </Link>
                <Link
                  href="/settings#switch-role"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-[14px] font-medium text-cream-muted hover:text-amber hover:bg-[rgba(232,165,60,0.06)] transition-colors"
                >
                  <RefreshCw className="h-4 w-4 text-cream-subtle" />
                  Switch to {user?.role === 'founder' ? 'investor' : 'founder'} mode
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-[10px] px-4 py-3 text-[14px] font-medium text-cream-muted hover:text-[#FF6B6B] hover:bg-[rgba(255,69,58,0.06)] transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          ) : (
            !isAuthPage && (
              <div className="flex flex-col gap-2 p-5">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="px-4 py-3 text-[14px] font-medium text-cream-muted">Log in</Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" fullWidth>Get started</Button>
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </>
  )
}
