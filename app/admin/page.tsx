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
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  loading: boolean
}) {
  return (
    <div className="glass-card border-t-2 border-t-[rgba(201,168,76,0.6)] p-6 backdrop-blur-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-body font-light text-[12px] text-[rgba(255,255,255,0.5)] tracking-[2px] uppercase">{label}</p>
          {loading ? (
            <div className="mt-2 h-9 w-20 shimmer rounded-[4px]" />
          ) : (
            <p className="mt-2 font-heading font-black text-[48px] leading-none text-[#C9A84C]">{value}</p>
          )}
        </div>
        <Icon className="h-5 w-5 text-[rgba(255,255,255,0.4)]" />
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
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    declined: 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider rounded ${
        colors[status] ?? 'bg-muted/20 text-muted'
      }`}
    >
      {status}
    </span>
  )
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider rounded ${
        role === 'founder'
          ? 'bg-navy/10 text-navy'
          : 'bg-gold/20 text-navy border border-gold/40'
      }`}
    >
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
          <h1 className="font-heading text-3xl font-bold text-navy">Dashboard Overview</h1>
          <p className="mt-1 text-sm text-muted">Platform-wide statistics and recent activity</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-muted/40 bg-white/60 px-4 py-2 rounded text-sm font-medium text-navy transition-colors hover:bg-white disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
                {stats.pendingStartups} startup{stats.pendingStartups !== 1 ? 's' : ''} pending review →
              </Link>
            )}
            {stats.pendingInvestors > 0 && (
              <Link href="/admin/investors" className="hover:underline">
                {stats.pendingInvestors} investor{stats.pendingInvestors !== 1 ? 's' : ''} pending verification →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Founders" value={stats.totalFounders} icon={Rocket} loading={loading} />
        <StatCard label="Total Investors" value={stats.totalInvestors} icon={Briefcase} loading={loading} />
        <StatCard label="Total Matches" value={stats.totalMatches} icon={Handshake} loading={loading} />
        <StatCard label="Deals Closed" value={stats.dealsClosed} icon={CheckSquare} loading={loading} />
      </div>

      {/* Recent Signups */}
      <div className="border border-muted/30 bg-white/40 backdrop-blur-sm rounded shadow-sm">
        <div className="border-b border-muted/20 px-6 py-4">
          <h2 className="font-heading text-xl font-bold text-navy">Recent Signups</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted/20 text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {loading ? (
                <SkeletonRows cols={4} />
              ) : recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted">
                    No users yet.
                  </td>
                </tr>
              ) : (
                recentUsers.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-white/30">
                    <td className="px-4 py-3 font-medium text-navy">
                      {u.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(u.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="border border-muted/30 bg-white/40 backdrop-blur-sm rounded shadow-sm">
        <div className="border-b border-muted/20 px-6 py-4">
          <h2 className="font-heading text-xl font-bold text-navy">Recent Matches</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-muted/20 text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-3 font-medium">Startup</th>
                <th className="px-4 py-3 font-medium">Investor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted/10">
              {loading ? (
                <SkeletonRows cols={4} />
              ) : recentMatches.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted">
                    No matches yet.
                  </td>
                </tr>
              ) : (
                recentMatches.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-white/30">
                    <td className="px-4 py-3 font-medium text-navy">
                      {(m.startups as { name: string } | null)?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {(
                        m.investors as {
                          users: { full_name: string | null } | null
                        } | null
                      )?.users?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(m.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
