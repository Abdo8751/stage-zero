'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { BarChart3, Users, Briefcase, Handshake, MessageSquare, LogOut, UserCog, Menu, X } from 'lucide-react'

interface SidebarStats {
  founders: number
  investors: number
  matches: number
  messages: number
  users: number
}

const NAV_ITEMS = [
  { href: '/admin',           label: 'Overview',  icon: BarChart3 },
  { href: '/admin/users',     label: 'Users',     icon: UserCog,       statKey: 'users'      as const },
  { href: '/admin/founders',  label: 'Startups',  icon: Users,         statKey: 'founders'   as const },
  { href: '/admin/investors', label: 'Investors', icon: Briefcase,     statKey: 'investors'  as const },
  { href: '/admin/matches',   label: 'Matches',   icon: Handshake,     statKey: 'matches'    as const },
  { href: '/admin/messages',  label: 'Messages',  icon: MessageSquare, statKey: 'messages'   as const },
]

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [stats, setStats] = useState<SidebarStats>({ founders: 0, investors: 0, matches: 0, messages: 0, users: 0 })

  useEffect(() => {
    const hasAdminCookie = document.cookie.split(';').some((c) => c.trim() === 'admin_auth=true')
    if (!hasAdminCookie) router.replace('/admin/login')
  }, [router])

  useEffect(() => {
    const run = async () => {
      const supabase = createClient()
      const [
        { count: usersCount },
        { count: foundersCount },
        { count: investorsCount },
        { count: matchesCount },
        { count: messagesCount },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'founder'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'investor'),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
      ])
      setStats({ users: usersCount ?? 0, founders: foundersCount ?? 0, investors: investorsCount ?? 0, matches: matchesCount ?? 0, messages: messagesCount ?? 0 })
    }
    void run()
  }, [pathname])

  const handleLogout = () => {
    document.cookie = 'admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    router.replace('/admin/login')
  }

  const Sidebar = (
    <aside className="flex h-full w-[260px] shrink-0 flex-col border-r border-[rgba(8,10,20,0.12)] bg-[rgba(255,255,255,0.90)] backdrop-blur-[40px]">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-[rgba(8,10,20,0.10)] px-6 py-5">
        <div>
          <p className="text-[18px] font-black tracking-[-0.05em] text-[#080A14] uppercase">Stage Zero</p>
          <p className="mt-0.5 text-[9px] font-black tracking-[0.28em] uppercase text-amber">Admin Panel</p>
        </div>
        <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 text-[rgba(8,10,20,0.45)] hover:text-[#080A14]">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href)
            const count    = item.statKey ? stats[item.statKey] : null
            const Icon     = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-[12px] text-[13px] font-bold tracking-[-0.01em] transition-all duration-150 ${
                    isActive
                      ? 'bg-[#080A14] text-white shadow-[0_4px_16px_rgba(8,10,20,0.22)]'
                      : 'text-[rgba(8,10,20,0.58)] hover:text-[#080A14] hover:bg-[rgba(8,10,20,0.06)]'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {count !== null && (
                    <span className={`rounded-[6px] px-2 py-0.5 text-[10px] font-black ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[rgba(8,10,20,0.08)] text-[rgba(8,10,20,0.50)]'
                    }`}>
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
      <div className="border-t border-[rgba(8,10,20,0.10)] px-3 py-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-[12px] px-4 py-2.5 text-[13px] font-bold text-[rgba(8,10,20,0.50)] hover:text-[#C0231A] hover:bg-[rgba(180,30,20,0.06)] transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen" style={{ background: 'inherit' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-[rgba(8,10,20,0.25)] backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-[260px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {Sidebar}
      </div>

      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <div className="fixed inset-y-0 left-0 z-40 w-[260px] lg:hidden shadow-2xl">
          {Sidebar}
        </div>
      )}

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-[rgba(8,10,20,0.10)] bg-[rgba(255,255,255,0.88)] px-5 py-3.5 backdrop-blur-[40px] lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="rounded-[8px] p-2 text-[rgba(8,10,20,0.60)] hover:bg-[rgba(8,10,20,0.06)] hover:text-[#080A14] transition-colors" aria-label="Open sidebar">
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-[16px] font-black tracking-[-0.04em] text-[#080A14] uppercase">Stage Zero Admin</span>
        </header>

        <main className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/admin/login') return <>{children}</>
  return <AdminShell>{children}</AdminShell>
}
