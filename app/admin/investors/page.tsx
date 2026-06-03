'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { RefreshCw, CheckCircle2, XCircle, CreditCard } from 'lucide-react'

interface InvestorRow {
  userId: string
  fullName: string | null
  email: string
  linkedinUrl: string | null
  chequeSize: string | null
  location: string | null
  verificationStatus: string
  credits: number
  joinedAt: string
  investorId: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusChip({ status }: { status: string }) {
  const c = {
    pending:  'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-300 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
  }[status] ?? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold tracking-[2px] uppercase rounded-[4px] border ${c}`}>
      {status}
    </span>
  )
}

type ModalAction = 'approve' | 'reject' | 'credits'

export default function AdminInvestorsPage() {
  const [investors, setInvestors]   = useState<InvestorRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal]           = useState<{ row: InvestorRow; action: ModalAction } | null>(null)
  const [reason, setReason]         = useState('')
  const [creditsAmount, setCreditsAmount] = useState('3')
  const [acting, setActing]         = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data: investorData } = await supabase
      .from('investors')
      .select('id, user_id, linkedin_url, cheque_size, location, verification_status, credits, created_at')
      .order('created_at', { ascending: false })

    if (!investorData) { setInvestors([]); setLoading(false); return }

    const userIds = investorData.map((i) => i.user_id)
    const { data: users } = await supabase
      .from('users').select('id, full_name, email').in('id', userIds)
    const userMap = new Map((users ?? []).map((u) => [u.id, u]))

    setInvestors(investorData.map((inv) => {
      const u = userMap.get(inv.user_id)
      return {
        userId: inv.user_id,
        fullName: u?.full_name ?? null,
        email: u?.email ?? '',
        linkedinUrl: inv.linkedin_url,
        chequeSize: inv.cheque_size,
        location: inv.location,
        verificationStatus: inv.verification_status,
        credits: inv.credits,
        joinedAt: inv.created_at,
        investorId: inv.id,
      }
    }))
    setLoading(false)
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const filtered = investors.filter((inv) => {
    const q = search.toLowerCase()
    return (!q || (inv.fullName?.toLowerCase().includes(q) ?? false) || inv.email.toLowerCase().includes(q))
      && (!statusFilter || inv.verificationStatus === statusFilter)
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.verificationStatus === 'pending' && b.verificationStatus !== 'pending') return -1
    if (b.verificationStatus === 'pending' && a.verificationStatus !== 'pending') return 1
    return 0
  })

  const pendingCount = investors.filter((i) => i.verificationStatus === 'pending').length

  const handleAction = async () => {
    if (!modal) return
    const { row, action } = modal
    if (action === 'reject' && !reason.trim()) return
    setActing(true)

    try {
      const supabase = createClient()

      if (action === 'approve') {
        await supabase.from('investors').update({ verification_status: 'approved', credits: 3 }).eq('id', row.investorId)
        await supabase.from('users').update({ is_verified: true }).eq('id', row.userId)
        await fetch('/api/notifications', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: row.userId, type: 'investor_approved',
            message: 'Your investor profile has been verified. You have 3 free credits to get started.',
            link: '/browse', emailFn: 'sendInvestorApproved',
            emailArgs: { to: row.email, name: row.fullName ?? 'Investor' },
          }),
        })
      } else if (action === 'reject') {
        await supabase.from('investors').update({ verification_status: 'rejected' }).eq('id', row.investorId)
        await supabase.from('users').update({ is_verified: false }).eq('id', row.userId)
        await fetch('/api/notifications', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: row.userId, type: 'investor_rejected',
            message: `Your investor verification was not approved. Reason: ${reason.trim()}`,
            link: '/investor/verify', emailFn: 'sendInvestorRejected',
            emailArgs: { to: row.email, name: row.fullName ?? 'Investor', reason: reason.trim() },
          }),
        })
      } else if (action === 'credits') {
        const n = parseInt(creditsAmount, 10)
        if (n > 0) {
          await supabase.from('investors').update({ credits: n }).eq('id', row.investorId)
        }
      }

      setModal(null)
      setReason('')
      setCreditsAmount('3')
      await fetchData()
    } catch { /* handled silently */ }
    setActing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-navy">Investors</h1>
          <p className="mt-1 text-sm text-muted">
            {pendingCount > 0 && <span className="mr-2 font-semibold text-yellow-600">{pendingCount} pending verification</span>}
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
          placeholder="Search by name or email…"
          className="flex-1 border border-muted/40 bg-white/60 px-4 py-2.5 rounded text-sm text-navy placeholder:text-muted/70 focus:outline-none focus:ring-1 focus:ring-gold" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-muted/40 bg-white/60 px-4 py-2.5 rounded text-sm text-navy focus:outline-none focus:ring-1 focus:ring-gold">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="glass-card overflow-x-auto shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.08)] text-[10px] tracking-[3px] uppercase text-[rgba(255,255,255,0.35)] font-medium">
              {['Investor', 'LinkedIn', 'Cheque size', 'Location', 'Credits', 'Status', 'Joined', 'Actions'].map((h) => (
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
              <tr><td colSpan={8} className="px-6 py-10 text-center text-sm text-[rgba(255,255,255,0.35)]">No investors found.</td></tr>
            ) : sorted.map((inv) => (
              <tr key={inv.userId} className={`hover:bg-[rgba(255,255,255,0.04)] transition-colors ${inv.verificationStatus === 'pending' ? 'bg-yellow-500/5' : ''}`}>
                <td className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-[rgba(255,255,255,0.85)]">{inv.fullName ?? '—'}</p>
                  <p className="text-[11px] text-[rgba(255,255,255,0.40)]">{inv.email}</p>
                </td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)]">
                  {inv.linkedinUrl ? <a href={inv.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[120px] block">LinkedIn</a> : '—'}
                </td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)] whitespace-nowrap">{inv.chequeSize ?? '—'}</td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)]">{inv.location ?? '—'}</td>
                <td className="px-4 py-3 text-[13px] font-bold text-amber">{inv.credits}</td>
                <td className="px-4 py-3"><StatusChip status={inv.verificationStatus} /></td>
                <td className="px-4 py-3 text-[12px] text-[rgba(255,255,255,0.65)] whitespace-nowrap">{formatDate(inv.joinedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {inv.verificationStatus === 'pending' && (
                      <>
                        <button onClick={() => { setModal({ row: inv, action: 'approve' }); setReason('') }}
                          title="Approve" className="flex h-7 w-7 items-center justify-center rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => { setModal({ row: inv, action: 'reject' }); setReason('') }}
                          title="Reject" className="flex h-7 w-7 items-center justify-center rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button onClick={() => { setModal({ row: inv, action: 'credits' }); setCreditsAmount(String(inv.credits)) }}
                      title="Set credits" className="flex h-7 w-7 items-center justify-center rounded bg-amber/20 text-amber hover:bg-amber/30 transition-colors">
                      <CreditCard className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-[rgba(255,255,255,0.12)] bg-[#0D0D18] p-6 shadow-2xl">
            <h2 className="text-[18px] font-black text-cream">
              {modal.action === 'approve' ? `Approve ${modal.row.fullName ?? 'investor'}` :
               modal.action === 'reject'  ? `Reject ${modal.row.fullName ?? 'investor'}` :
               `Set credits for ${modal.row.fullName ?? 'investor'}`}
            </h2>

            {modal.action === 'approve' && (
              <p className="mt-3 text-[14px] text-cream-muted">This will verify the investor and grant them <strong className="text-amber">3 free starter credits</strong>. They will be notified by email.</p>
            )}

            {modal.action === 'reject' && (
              <div className="mt-4">
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">Rejection reason (required)</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] rounded-[10px] px-4 py-3 text-[14px] text-cream focus:border-[rgba(75,124,246,0.5)] focus:outline-none resize-none"
                  placeholder="Tell the investor why they were not approved…" />
              </div>
            )}

            {modal.action === 'credits' && (
              <div className="mt-4">
                <label className="mb-1.5 block text-[12px] font-semibold uppercase tracking-[0.08em] text-cream-subtle">Credit amount</label>
                <input type="number" min="0" max="999" value={creditsAmount} onChange={(e) => setCreditsAmount(e.target.value)}
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] rounded-[10px] px-4 py-3 text-[14px] text-cream focus:border-[rgba(75,124,246,0.5)] focus:outline-none" />
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button onClick={() => { setModal(null); setReason('') }}
                className="flex-1 rounded-[10px] border border-[rgba(255,255,255,0.10)] py-2.5 text-[14px] font-medium text-cream-muted hover:text-cream transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleAction}
                disabled={acting || (modal.action === 'reject' && !reason.trim())}
                className={`flex-1 rounded-[10px] py-2.5 text-[14px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                  modal.action === 'approve' ? 'bg-green-600 text-white hover:bg-green-700' :
                  modal.action === 'reject'  ? 'bg-red-600 text-white hover:bg-red-700' :
                  'bg-amber/80 text-navy hover:bg-amber'
                }`}>
                {acting ? 'Processing…' : modal.action === 'approve' ? 'Approve & grant 3 credits' : modal.action === 'reject' ? 'Reject' : 'Set credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
