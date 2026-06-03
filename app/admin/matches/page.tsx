'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { RefreshCw } from 'lucide-react'

interface MatchRow {
  id: string
  status: string
  is_deal_closed: boolean
  created_at: string
  startupName: string
  founderName: string
  investorName: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-EG', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-800',
    accepted: 'bg-emerald-100 text-emerald-800',
    declined: 'bg-red-100 text-red-800',
  }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider rounded ${
        styles[status] ?? 'bg-muted/20 text-muted'
      }`}
    >
      {status}
    </span>
  )
}

function SkeletonRows({ rows = 8 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted/20" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<MatchRow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    // Fetch matches with startup info and investor info via joins
    const { data } = await supabase
      .from('matches')
      .select(
        `
        id,
        status,
        is_deal_closed,
        created_at,
        startup_id,
        investor_id,
        startups (
          name,
          user_id,
          users (
            full_name
          )
        ),
        investors (
          users (
            full_name
          )
        )
      `
      )
      .order('created_at', { ascending: false })

    if (!data) {
      setMatches([])
      setLoading(false)
      return
    }

    const rows: MatchRow[] = data.map((m: Record<string, unknown>) => {
      const startups = m.startups as { name: string; users: { full_name: string | null } | null } | null
      const investors = m.investors as { users: { full_name: string | null } | null } | null

      return {
        id: m.id as string,
        status: m.status as string,
        is_deal_closed: m.is_deal_closed as boolean,
        created_at: m.created_at as string,
        startupName: startups?.name ?? '—',
        founderName: startups?.users?.full_name ?? '—',
        investorName: investors?.users?.full_name ?? '—',
      }
    })

    setMatches(rows)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = statusFilter
    ? matches.filter((m) => m.status === statusFilter)
    : matches

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">Matches</h1>
          <p className="mt-1 text-sm text-muted">
            {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
          </p>
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

      {/* Filter */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-muted/40 bg-white/60 px-4 py-2.5 rounded text-sm text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] text-[10px] tracking-[3px] uppercase text-[rgba(255,255,255,0.35)] font-body font-medium">
                <th className="px-6 py-4">Startup</th>
                <th className="px-6 py-4">Founder</th>
                <th className="px-6 py-4">Investor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Deal Closed</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {loading ? (
                <SkeletonRows />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-[rgba(255,255,255,0.35)] font-body font-light text-sm">
                    {statusFilter ? 'No matches with this status.' : 'No matches yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-[rgba(255,255,255,0.04)]">
                    <td className="whitespace-nowrap px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.95)]">
                      {m.startupName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.75)]">{m.founderName}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.75)]">{m.investorName}</td>
                    <td className="px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.75)]">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.75)]">
                      {m.is_deal_closed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#34C759]">
                          <span className="text-sm">✓</span> Yes
                        </span>
                      ) : (
                        <span className="text-xs text-[rgba(255,255,255,0.4)]">No</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 font-body font-light text-[13px] text-[rgba(255,255,255,0.75)]">
                      {formatDate(m.created_at)}
                    </td>
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
