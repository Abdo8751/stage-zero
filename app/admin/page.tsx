'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Rocket, Briefcase, Handshake, CheckSquare, RefreshCw, AlertCircle } from 'lucide-react'

interface Stats {
  totalFounders: number
  totalInvestors: number
  totalMatches: number
  dealsClosed: number
  pendingStartups: number
  pendingInvestors: number
}

interface RecentUser {
  id: string
  full_name: string | null
  email: string
  role: string
  created_at: string
}

interface RecentMatch {
  id: string
  status: string
  created_at: string
  startups: { name: string } | null
  investors: { users: { full_name: string | null } | null } | null
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  accent = 'amber',
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
  accent?: 'amber' | 'blue' | 'green' | 'cream'
}) {
  const colors = {
    amber: { num: 'text-amber', icon: 'bg-[rgba(232,165,60,0.12)] border-[rgba(232,165,60,0.22)] text-amber', top: 'border-t-[rgba(232,165,60,0.55)]' },
    blue:  { num: 'text-blue-bright', icon: 'bg-[rgba(75,124,246,0.12)] border-[rgba(75,124,246,0.22)] text-blue-bright', top: 'border-t-[rgba(75,124,246,0.55)]' },
    green: { num: 'text-[#30D158]', icon: 'bg-[rgba(52,199,89,0.12)] border-[rgba(52,199,89,0.22)] text-[#30D158]', top: 'border-t-[rgba(52,199,89,0.45)]' },
    cream: { num: 'text-cream', icon: 'bg-[rgba(8,10,20,0.07)] border-[rgba(8,10,20,0.14)] text-cream-muted', top: 'border-t-[rgba(8,10,20,0.25)]' },
  }[accent]
  return (
    <div className={`glass-card border-t-2 ${colors.top} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cream-subtle">{label}</p>
          {loading
            ? <div className="mt-2.5 h-9 w-16 shimmer rounded-[6px]" />
            : <p className={`mt-2 text-[40px] font-black leading-none tracking-tight ${colors.num}`}>{value}</p>
          }
        </div>
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border ${colors.icon}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  )
}

function SkeletonRows({ cols, rows = 5 }: { cols: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted/20" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-EG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending:  'bg-[rgba(232,165,60,0.15)] text-amber border-[rgba(232,165,60,0.30)]',
    accepted: 'bg-[rgba(52,199,89,0.15)] text-[#30D158] border-[rgba(52,199,89,0.30)]',
    declined: 'bg-[rgba(255,69,58,0.15)] text-[#FF6B6B] border-[rgba(255,69,58,0.30)]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] rounded-[4px] border ${colors[status] ?? 'bg-[rgba(240,230,208,0.08)] text-cream-subtle border-[rgba(240,230,208,0.12)]'}`}>
      {status}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] rounded-[4px] border ${
      role === 'founder'
        ? 'bg-[rgba(75,124,246,0.15)] text-blue-bright border-[rgba(75,124,246,0.30)]'
        : 'bg-[rgba(232,165,60,0.15)] text-amber border-[rgba(232,165,60,0.30)]'
    }`}>
      {role}
    </span>
  )
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats>({
    totalFounders: 0,
    totalInvestors: 0,
    totalMatches: 0,
    dealsClosed: 0,
    pendingStartups: 0,
    pendingInvestors: 0,
  })
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([])
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [
      { count: foundersCount },
      { count: investorsCount },
      { count: matchesCount },
      { count: dealsCount },
      { count: pendingStartupsCount },
      { count: pendingInvestorsCount },
      { data: users },
      { data: matches },
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'founder'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'investor'),
      supabase.from('matches').select('*', { count: 'exact', head: true }),
      supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_deal_closed', true),
      supabase.from('startups').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
      supabase.from('investors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
      supabase.from('users').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('matches').select('id, status, created_at, startups(name), investors(users(full_name))').order('created_at', { ascending: false }).limit(10),
    ])

    setStats({
      totalFounders: foundersCount ?? 0,
      totalInvestors: investorsCount ?? 0,
      totalMatches: matchesCount ?? 0,
      dealsClosed: dealsCount ?? 0,
      pendingStartups: pendingStartupsCount ?? 0,
      pendingInvestors: pendingInvestorsCount ?? 0,
    })
    setRecentUsers((users as RecentUser[]) ?? [])
    setRecentMatches((matches as unknown as RecentMatch[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-cream">Dashboard Overview</h1>
          <p className="mt-1 text-[13px] text-cream-muted">Platform-wide statistics and recent activity</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-[rgba(8,10,20,0.12)] bg-[rgba(240,230,208,0.06)] px-4 py-2 rounded-[10px] text-[13px] font-medium text-cream-muted hover:text-cream hover:bg-[rgba(8,10,20,0.08)] transition-colors disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Action items banner */}
      {(stats.pendingStartups > 0 || stats.pendingInvestors > 0) && !loading && (
        <div className="flex flex-col gap-2 rounded-[12px] border border-yellow-500/30 bg-yellow-500/10 p-4 sm:flex-row sm:items-center sm:gap-4">
          <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0" />
          <div className="flex flex-wrap gap-4 text-[13px] font-medium text-yellow-300">
            {stats.pendingStartups > 0 && (
              <Link href="/admin/founders" className="hover:underline">
                {stats.pendingStartups} startup{stats.pendingStartups !== 1 ? 's' : ''} pending review â†’
              </Link>
            )}
            {stats.pendingInvestors > 0 && (
              <Link href="/admin/investors" className="hover:underline">
                {stats.pendingInvestors} investor{stats.pendingInvestors !== 1 ? 's' : ''} pending verification â†’
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Founders" value={stats.totalFounders} icon={Rocket}     loading={loading} accent="blue" />
        <StatCard label="Total Investors" value={stats.totalInvestors} icon={Briefcase} loading={loading} accent="amber" />
        <StatCard label="Total Matches" value={stats.totalMatches} icon={Handshake}     loading={loading} accent="green" />
        <StatCard label="Deals Closed" value={stats.dealsClosed} icon={CheckSquare}     loading={loading} accent="cream" />
      </div>

      {/* Recent Signups */}
      <div className="glass-card overflow-hidden">
        <div className="border-b border-[rgba(240,230,208,0.08)] px-6 py-4">
          <h2 className="text-[16px] font-black tracking-tight text-cream">Recent signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(8,10,20,0.10)] text-[10px] tracking-[0.14em] uppercase text-cream-subtle font-medium">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(8,10,20,0.08)]">
              {loading ? (
                <SkeletonRows cols={4} />
              ) : recentUsers.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[13px] text-cream-subtle">No users yet.</td></tr>
              ) : recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-[rgba(240,230,208,0.03)] transition-colors">
                  <td className="px-4 py-3 text-[13px] font-semibold text-cream">{u.full_name ?? 'â€”'}</td>
                  <td className="px-4 py-3 text-[12px] text-cream-muted">{u.email}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-[12px] text-cream-subtle whitespace-nowrap">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-[rgba(240,230,208,0.08)] px-6 py-4">
          <h2 className="text-[16px] font-black tracking-tight text-cream">Recent matches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(8,10,20,0.10)] text-[10px] tracking-[0.14em] uppercase text-cream-subtle font-medium">
                <th className="px-4 py-3">Startup</th>
                <th className="px-4 py-3">Investor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(8,10,20,0.08)]">
              {loading ? (
                <SkeletonRows cols={4} />
              ) : recentMatches.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-[13px] text-cream-subtle">No matches yet.</td></tr>
              ) : recentMatches.map((m) => (
                <tr key={m.id} className="hover:bg-[rgba(240,230,208,0.03)] transition-colors">
                  <td className="px-4 py-3 text-[13px] font-semibold text-cream">
                    {(m.startups as { name: string } | null)?.name ?? 'â€”'}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-cream-muted">
                    {(m.investors as { users: { full_name: string | null } | null } | null)?.users?.full_name ?? 'â€”'}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3 text-[12px] text-cream-subtle whitespace-nowrap">{formatDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

