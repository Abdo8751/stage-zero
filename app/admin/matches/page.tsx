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
    pending:  'bg-[rgba(232,165,60,0.15)] text-amber border-[rgba(232,165,60,0.30)]',
    accepted: 'bg-[rgba(52,199,89,0.15)] text-[#30D158] border-[rgba(52,199,89,0.30)]',
    declined: 'bg-[rgba(255,69,58,0.15)] text-[#FF6B6B] border-[rgba(255,69,58,0.30)]',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] rounded-[4px] border ${styles[status] ?? 'bg-[rgba(240,230,208,0.08)] text-cream-subtle border-[rgba(240,230,208,0.12)]'}`}>
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
              <div className="h-4 w-full rounded bg-[rgba(240,230,208,0.06)] shimmer" />
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
        startupName: startups?.name ?? 'â€”',
        founderName: startups?.users?.full_name ?? 'â€”',
        investorName: investors?.users?.full_name ?? 'â€”',
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
          <h1 className="text-[26px] font-black tracking-tight text-cream">Matches</h1>
          <p className="mt-1 text-[13px] text-cream-muted">
            {filtered.length} match{filtered.length !== 1 ? 'es' : ''}
          </p>
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

      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[rgba(255,255,255,0.10)] bg-white px-4 py-2.5 rounded-[10px] text-[13px] text-cream focus:outline-none focus:border-[rgba(8,10,20,0.45)] transition-colors cursor-pointer [&>option]:bg-white"
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
              <tr className="border-b border-[rgba(8,10,20,0.10)] text-[10px] tracking-[3px] uppercase text-[rgba(255,255,255,0.35)] font-body font-medium">
                <th className="px-6 py-4">Startup</th>
                <th className="px-6 py-4">Founder</th>
                <th className="px-6 py-4">Investor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Deal Closed</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(8,10,20,0.08)]">
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
                          <span className="text-sm">âœ“</span> Yes
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

