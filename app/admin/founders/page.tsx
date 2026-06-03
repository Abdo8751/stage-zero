'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, MessageSquare } from 'lucide-react'
import type { StartupStatus } from '@/lib/types'

interface StartupRow {
  id: string
  name: string
  sector: string[]
  stage: string
  raise_amount: number | null
  status: StartupStatus
  is_active: boolean
  rejection_reason: string | null
  created_at: string
  founder_name: string | null
  founder_email: string
  founder_id: string
}

const STATUS_MAP: Record<StartupStatus, string> = {
  pending_review: 'Pending review',
  active: 'Active',
  paused: 'Paused',
  rejected: 'Rejected',
  changes_requested: 'Changes requested',
}

function StatusChip({ status }: { status: StartupStatus }) {
  const c = {
    pending_review:    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    active:            'bg-green-500/20 text-green-300 border-green-500/30',
    paused:            'bg-gray-500/20 text-gray-400 border-gray-500/30',
    rejected:          'bg-red-500/20 text-red-300 border-red-500/30',
    changes_requested: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  }[status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold tracking-[2px] uppercase rounded-[4px] border ${c}`}>
      {STATUS_MAP[status] ?? status}
    </span>
  )
}

function stageName(s: string) {
  return { pre_seed: 'Pre-seed', seed: 'Seed', series_a: 'Series A', series_b: 'Series B' }[s] ?? s
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatAmount(n: number | null) {
  if (!n) return '—'
  return n >= 1_000_000 ? `EGP ${(n / 1_000_000).toFixed(1)}M` : `EGP ${(n / 1_000).toFixed(0)}K`
}

export default function AdminFoundersPage() {
  const [rows, setRows]         = useState<StartupRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  // Action modal
  const [modal, setModal]       = useState<{ row: StartupRow; action: 'approve' | 'reject' | 'changes' } | null>(null)
  const [reason, setReason]     = useState('')
  const [acting, setActing]     = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: startups } = await supabase
      .from('startups')
      .select('id, name, sector, stage, raise_amount, status, is_active, rejection_reason, created_at, user_id')
      .order('created_at', { ascending: false })

    if (!startups) { setRows([]); setLoading(false); return }

    const userIds = Array.from(new Set(startups.map((s) => s.user_id)))
    const { data: users } = await supabase
      .from('users').select('id, full_name, email').in('id', userIds)
    const userMap = new Map((users ?? []).map((u) => [u.id, u]))

    setRows(startups.map((s) => {
      const u = userMap.get(s.user_id)
      return {
        id: s.id, name: s.name, sector: s.sector, stage: s.stage,
        raise_amount: s.raise_amount, status: s.status as StartupStatus,
        is_active: s.is_active, rejection_reason: s.rejection_reason,
        created_at: s.created_at,
        founder_name: u?.full_name ?? null,
        founder_email: u?.email ?? '',
        founder_id: s.user_id,
      }
    }))
    setLoading(false)
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase()
    return (!q || r.name.toLowerCase().includes(q) || (r.founder_name?.toLowerCase().includes(q) ?? false) || r.founder_email.toLowerCase().includes(q))
      && (!statusFilter || r.status === statusFilter)
  })

  // Sort: pending_review first
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === 'pending_review' && b.status !== 'pending_review') return -1
    if (b.status === 'pending_review' && a.status !== 'pending_review') return 1
    return 0
  })

  const pendingCount = rows.filter((r) => r.status === 'pending_review').length

  const handleAction = async () => {
    if (!modal) return
    const { row, action } = modal
    if ((action === 'reject' || action === 'changes') && !reason.trim()) return

    setActing(true)
    try {
      const supabase = createClient()

      if (action === 'approve') {
        await supabase.from('startups').update({ status: 'active', is_active: true, rejection_reason: null }).eq('id', row.id)
        // Notify founder
        await fetch('/api/notifications', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: row.founder_id, type: 'startup_approved',
            message: `Your startup "${row.name}" has been approved and is now live!`,
            link: '/dashboard', emailFn: 'sendStartupApproved',
            emailArgs: { to: row.founder_email, startupName: row.name },
          }),
        })
      } else if (action === 'reject') {
        await supabase.from('startups').update({ status: 'rejected', is_active: false, rejection_reason: reason.trim() }).eq('id', row.id)
        await fetch('/api/notifications', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: row.founder_id, type: 'startup_rejected',
            message: `Your startup "${row.name}" was not approved. Reason: ${reason.trim()}`,
            link: '/dashboard', emailFn: 'sendStartupRejected',
            emailArgs: { to: row.founder_email, startupName: row.name, reason: reason.trim() },
          }),
        })
      } else {
        await supabase.from('startups').update({ status: 'changes_requested', rejection_reason: reason.trim() }).eq('id', row.id)
        await fetch('/api/notifications', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: row.founder_id, type: 'startup_changes_requested',
            message: `Changes requested for "${row.name}": ${reason.trim()}`,
            link: '/profile/edit', emailFn: 'sendStartupChangesRequested',
            emailArgs: { to: row.founder_email, startupName: row.name, changes: reason.trim() },
          }),
        })
      }

      setModal(null)
      setReason('')
      await fetchData()
    } catch { /* handled silently */ }
    setActing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">Startups</h1>
          <p className="mt-1 text-sm text-muted">
            {pendingCount > 0 && <span className="mr-2 font-semibold text-yellow-600">{pendingCount} pending review</span>}
            {filtered.length} total
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="inline-flex items-center gap-2 border border-muted/40 bg-white/60 px-4 py-2 rounded text-sm font-medium text-navy hover:bg-white disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by startup or founder…"
          className="flex-1 border border-muted/40 bg-white/60 px-4 py-2.5 rounded text-sm text-navy placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-gold" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-muted/40 bg-white/60 px-4 py-2.5 rounded text-sm text-navy focus:outline-none focus:ring-1 focus:ring-gold">
          <option value="">All statuses</option>
          <option value="pending_review">Pending review</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="rejected">Rejected</option>
          <option value="changes_requested">Changes requested</option>
        </select>
      </div>

      <div className="glass-card overflow-x-auto shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)] text-[10px] tracking-[3px] uppercase text-[rgba(255,255,255,0.35)] font-medium">
              {['Startup', 'Founder', 'Sector', 'Stage', 'Raise', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 w-full animate-pulse rounded bg-white/10" /></td>)}</tr>
              ))
            ) : sorted.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-[rgba(255,255,255,0.35)]">No startups found.</td></tr>
            ) : sorted.map((r) => (
              <tr key={r.id} className={`hover:bg-[rgba(255,255,255,0.04)] transition-colors ${r.status === 'pending_review' ? 'bg-yellow-500/5' : ''}`}>
                <td className="px-4 py-3 text-[13px] font-semibold text-[rgba(255,255,255,0.85)]">{r.name}</td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)]">
                  <p>{r.founder_name ?? '—'}</p>
                  <p className="text-[rgba(255,255,255,0.35)]">{r.founder_email}</p>
                </td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)]">{r.sector.slice(0,2).join(', ') || '—'}</td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)] whitespace-nowrap">{stageName(r.stage)}</td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)] whitespace-nowrap">{formatAmount(r.raise_amount)}</td>
                <td className="px-4 py-3"><StatusChip status={r.status} /></td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)] whitespace-nowrap">{formatDate(r.created_at)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 flex-nowrap">
                    {(r.status === 'pending_review' || r.status === 'changes_requested') && (
                      <>
                        <button onClick={() => { setModal({ row: r, action: 'approve' }); setReason('') }}
                          title="Approve" className="flex h-7 w-7 items-center justify-center rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setModal({ row: r, action: 'changes' }); setReason('') }}
                          title="Request changes" className="flex h-7 w-7 items-center justify-center rounded bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors">
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setModal({ row: r, action: 'reject' }); setReason('') }}
                          title="Reject" className="flex h-7 w-7 items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#0D0D18] p-6 shadow-2xl">
            <h2 className="text-[18px] font-black text-cream">
              {modal.action === 'approve' ? `Approve "${modal.row.name}"` : modal.action === 'reject' ? `Reject "${modal.row.name}"` : `Request changes for "${modal.row.name}"`}
            </h2>
            {modal.action !== 'approve' && (
              <div className="mt-4">
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">
                  {modal.action === 'reject' ? 'Rejection reason (required)' : 'Changes needed (required)'}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] rounded-[10px] px-4 py-3 text-[14px] text-cream placeholder:text-cream-subtle focus:border-[rgba(75,124,246,0.5)] focus:outline-none resize-none"
                  placeholder={modal.action === 'reject' ? 'Tell the founder why their listing was not approved…' : 'Describe exactly what needs to change…'}
                />
              </div>
            )}
            {modal.action === 'approve' && (
              <p className="mt-3 text-[14px] text-cream-muted">This will set the startup to <strong className="text-cream">active</strong> and make it visible to investors. The founder will be notified.</p>
            )}
            <div className="mt-5 flex gap-3">
              <button onClick={() => { setModal(null); setReason('') }}
                className="flex-1 rounded-[10px] border border-[rgba(255,255,255,0.10)] py-2.5 text-[14px] font-medium text-cream-muted hover:text-cream transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={acting || (modal.action !== 'approve' && !reason.trim())}
                className={`flex-1 rounded-[10px] py-2.5 text-[14px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                  modal.action === 'approve' ? 'bg-green-600 text-white hover:bg-green-700' :
                  modal.action === 'reject'  ? 'bg-red-600 text-white hover:bg-red-700' :
                  'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {acting ? 'Processing…' : modal.action === 'approve' ? 'Approve & go live' : modal.action === 'reject' ? 'Reject' : 'Send feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
