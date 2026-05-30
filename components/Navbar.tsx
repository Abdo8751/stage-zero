'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'

const founderLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/interests', label: 'Interests' },
  { href: '/chat', label: 'Chat' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/settings', label: 'Settings' },
]

const investorLinks = [
  { href: '/browse', label: 'Browse' },
  { href: '/saved', label: 'Saved' },
  { href: '/chat', label: 'Chat' },
  { href: '/upgrade', label: 'Upgrade' },
  { href: '/notifications', label: 'Notifications' },
  { href: '/settings', label: 'Settings' },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setMobileOpen(false)
    router.push('/')
    router.refresh()
  }

  const links =
    user?.role === 'founder'
      ? founderLinks
      : user?.role === 'investor'
        ? investorLinks
        : []

  const isAuthPage = pathname === '/login' || pathname === '/signup'

  return (
    <header className="sticky top-0 z-50 border-b border-muted/30 bg-cream/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="font-heading text-xl font-bold tracking-tight text-navy sm:text-2xl">
          Stage Zero
          <span className="ml-1 text-xs font-body font-light text-muted sm:text-sm">Egypt</span>
        </Link>

        {/* Desktop */}
        <div className="hidden items-center gap-5 lg:flex">
          {loading ? (
            <span className="text-sm text-muted">Loading…</span>
          ) : user ? (
            <>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors hover:text-gold ${
                    pathname.startsWith(link.href) ? 'font-medium text-navy' : 'text-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            !isAuthPage && (
              <>
                <Link href="/login" className="text-sm text-muted transition-colors hover:text-navy">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button size="sm">Get started</Button>
                </Link>
              </>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded border border-muted/40 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className="sr-only">Menu</span>
          <div className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-5 bg-navy transition-transform ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`block h-0.5 w-5 bg-navy ${mobileOpen ? 'opacity-0' : ''}`} />
            <span className={`block h-0.5 w-5 bg-navy transition-transform ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-muted/30 bg-cream px-4 py-4 lg:hidden">
          {loading ? (
            <p className="text-sm text-muted">Loading…</p>
          ) : user ? (
            <div className="flex flex-col gap-3">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`py-2 text-sm ${
                    pathname.startsWith(link.href) ? 'font-medium text-navy' : 'text-muted'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="justify-start px-0">
                Sign out
              </Button>
            </div>
          ) : (
            !isAuthPage && (
              <div className="flex flex-col gap-3">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="py-2 text-sm text-muted">
                  Log in
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)}>
                  <Button size="sm" fullWidth>
                    Get started
                  </Button>
                </Link>
              </div>
            )
          )}
        </div>
      )}
    </header>
  )
}
