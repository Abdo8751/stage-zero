'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

import { BarChart3, Users, Briefcase, Handshake, MessageSquare, LogOut } from 'lucide-react'

interface SidebarStats {
  founders: number
  investors: number
  matches: number
  messages: number
}

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: BarChart3 },
  { href: '/admin/founders', label: 'Founders', icon: Users, statKey: 'founders' as const },
  { href: '/admin/investors', label: 'Investors', icon: Briefcase, statKey: 'investors' as const },
  { href: '/admin/matches', label: 'Matches', icon: Handshake, statKey: 'matches' as const },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare, statKey: 'messages' as const },
]

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [stats, setStats] = useState<SidebarStats>({
    founders: 0,
    investors: 0,
    matches: 0,
    messages: 0,
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      const [
        { count: foundersCount },
        { count: investorsCount },
        { count: matchesCount },
        { count: messagesCount },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'founder'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'investor'),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        founders: foundersCount ?? 0,
        investors: investorsCount ?? 0,
        matches: matchesCount ?? 0,
        messages: messagesCount ?? 0,
      })
    }
    fetchStats()
  }, [pathname])

  const handleLogout = () => {
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.replace('/admin/login')
  }

  return (
    <div className="flex min-h-screen bg-transparent">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-navy/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] backdrop-blur-[20px] transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-[rgba(255,255,255,0.08)] px-6 py-5">
          <div>
            <h2 className="font-heading text-lg font-bold text-white tracking-wide">
              <span className="font-bold tracking-widest text-white mr-1">STAGE</span>
              <span className="italic text-gold font-semibold">Zero</span>
            </h2>
            <span className="text-[10px] font-medium tracking-[4px] uppercase text-gold">
              Admin
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(item.href)
              const count = item.statKey ? stats[item.statKey] : null
              const Icon = item.icon

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center gap-3 px-6 py-3 text-[13px] font-body font-light tracking-wide transition-all ${
                      isActive
                        ? 'bg-[rgba(201,168,76,0.1)] border-l-2 border-gold text-[rgba(255,255,255,0.95)] font-normal'
                        : 'text-[rgba(255,255,255,0.6)] hover:bg-white/5 hover:text-white border-l-2 border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {count !== null && (
                      <span
                        className={`min-w-[1.5rem] rounded-[4px] px-1.5 py-0.5 text-center text-[10px] font-body ${
                          isActive
                            ? 'bg-gold/20 text-gold'
                            : 'bg-white/10 text-[rgba(255,255,255,0.4)] group-hover:text-[rgba(255,255,255,0.7)]'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t border-[rgba(255,255,255,0.08)] px-4 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-[8px] px-4 py-2.5 text-[13px] font-body font-light text-[rgba(255,255,255,0.6)] transition-colors hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[rgba(255,255,255,0.08)] bg-[rgba(10,15,26,0.7)] px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-2 text-white hover:bg-white/5"
            aria-label="Open sidebar"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-heading text-lg font-bold text-white">Admin</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Login page renders without the admin shell
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return <AdminShell>{children}</AdminShell>
}
