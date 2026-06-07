'use client'

import { useEffect, useState, useCallback } from 'react'
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
    pending:  'bg-[rgba(232,165,60,0.15)] text-amber border-[rgba(232,165,60,0.30)]',
    approved: 'bg-[rgba(52,199,89,0.15)] text-[#30D158] border-[rgba(52,199,89,0.30)]',
    rejected: 'bg-[rgba(255,69,58,0.15)] text-[#FF6B6B] border-[rgba(255,69,58,0.30)]',
  }[status] ?? 'bg-[rgba(240,230,208,0.08)] text-cream-subtle border-[rgba(240,230,208,0.12)]'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold tracking-[0.12em] uppercase rounded-[4px] border ${c}`}>
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
  const [actionError, setActionError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/data?type=investors')
    const json = await res.json() as { data?: unknown[]; error?: string }
    if (json.data) {
      setInvestors((json.data as Array<{
        id: string; user_id: string; linkedin_url: string | null;
        cheque_size: string | null; location: string | null;
        verification_status: string; credits: number; created_at: string;
        full_name: string | null; email: string;
      }>).map((inv) => ({
        userId: inv.user_id,
        fullName: inv.full_name,
        email: inv.email,
        linkedinUrl: inv.linkedin_url,
        chequeSize: inv.cheque_size,
        location: inv.location,
        verificationStatus: inv.verification_status,
        credits: inv.credits,
        joinedAt: inv.created_at,
        investorId: inv.id,
      })))
    }
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
    setActionError('')

    try {
      let body: Record<string, unknown>
      if (action === 'approve') {
        body = { action: 'approveInvestor', userId: row.userId, investorId: row.investorId, investorEmail: row.email, investorName: row.fullName ?? 'Investor' }
      } else if (action === 'reject') {
        body = { action: 'rejectInvestor', userId: row.userId, investorId: row.investorId, reason: reason.trim(), investorEmail: row.email, investorName: row.fullName ?? 'Investor' }
      } else {
        body = { action: 'setCredits', investorId: row.investorId, credits: parseInt(creditsAmount, 10) }
      }

      const res = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json() as { error?: string }
      if (!res.ok) throw new Error(result.error ?? 'Action failed')

      setModal(null)
      setReason('')
      setCreditsAmount('3')
      await fetchData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-cream">Investors</h1>
          <p className="mt-1 text-[13px] text-cream-muted">
            {pendingCount > 0 && <span className="mr-2 font-semibold text-amber">{pendingCount} pending verification Â· </span>}
            {filtered.length} total
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="inline-flex items-center gap-2 border border-[rgba(8,10,20,0.12)] bg-[rgba(240,230,208,0.06)] px-4 py-2 rounded-[10px] text-[13px] font-medium text-cream-muted hover:text-cream hover:bg-[rgba(8,10,20,0.08)] transition-colors disabled:opacity-40 cursor-pointer">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or emailâ€¦"
          className="flex-1 border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] px-4 py-2.5 rounded-[10px] text-[13px] text-cream placeholder:text-cream-subtle focus:outline-none focus:border-[rgba(8,10,20,0.45)] transition-colors" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[rgba(255,255,255,0.10)] bg-white px-4 py-2.5 rounded-[10px] text-[13px] text-cream focus:outline-none focus:border-[rgba(8,10,20,0.45)] transition-colors cursor-pointer [&>option]:bg-white">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[rgba(8,10,20,0.10)] text-[10px] tracking-[0.14em] uppercase text-cream-subtle font-medium">
              {['Investor', 'LinkedIn', 'Cheque size', 'Location', 'Credits', 'Status', 'Joined', 'Actions'].map((h) => (
                <th key={h} className="px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(8,10,20,0.08)]">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-4 w-full rounded shimmer" /></td>)}</tr>
              ))
            ) : sorted.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-10 text-center text-[13px] text-cream-subtle">No investors found.</td></tr>
            ) : sorted.map((inv) => (
              <tr key={inv.userId} className={`hover:bg-[rgba(8,10,20,0.03)] transition-colors ${inv.verificationStatus === 'pending' ? 'bg-[rgba(232,165,60,0.06)]' : ''}`}>
                <td className="px-4 py-3">
                  <p className="text-[13px] font-semibold text-cream">{inv.fullName ?? 'â€”'}</p>
                  <p className="text-[11px] text-cream-subtle">{inv.email}</p>
                </td>
                <td className="px-4 py-3 text-[12px] text-cream-muted">
                  {inv.linkedinUrl
                    ? <a href={inv.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-bright hover:underline">View â†’</a>
                    : 'â€”'}
                </td>
                <td className="px-4 py-3 text-[12px] text-cream-muted whitespace-nowrap">{inv.chequeSize ?? 'â€”'}</td>
                <td className="px-4 py-3 text-[12px] text-cream-muted">{inv.location ?? 'â€”'}</td>
                <td className="px-4 py-3 text-[13px] font-bold text-amber">{inv.credits}</td>
                <td className="px-4 py-3"><StatusChip status={inv.verificationStatus} /></td>
                <td className="px-4 py-3 text-[12px] text-cream-subtle whitespace-nowrap">{formatDate(inv.joinedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {inv.verificationStatus === 'pending' && (
                      <>
                        <button onClick={() => { setModal({ row: inv, action: 'approve' }); setActionError('') }}
                          title="Approve" className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[rgba(52,199,89,0.12)] text-[#30D158] hover:bg-[rgba(52,199,89,0.22)] transition-colors cursor-pointer">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => { setModal({ row: inv, action: 'reject' }); setReason(''); setActionError('') }}
                          title="Reject" className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[rgba(255,69,58,0.10)] text-[#FF453A] hover:bg-[rgba(255,69,58,0.20)] transition-colors cursor-pointer">
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                    <button onClick={() => { setModal({ row: inv, action: 'credits' }); setCreditsAmount(String(inv.credits)); setActionError('') }}
                      title="Set credits" className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[rgba(232,165,60,0.12)] text-amber hover:bg-[rgba(232,165,60,0.22)] transition-colors cursor-pointer">
                      <CreditCard className="h-3.5 w-3.5" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-[rgba(8,10,20,0.12)] bg-[rgba(255,255,255,0.97)] p-6 shadow-2xl">
            <h2 className="text-[18px] font-black text-cream mb-1">
              {modal.action === 'approve' ? `Approve ${modal.row.fullName ?? 'investor'}` :
               modal.action === 'reject'  ? `Reject ${modal.row.fullName ?? 'investor'}` :
               `Set credits â€” ${modal.row.fullName ?? 'investor'}`}
            </h2>

            {modal.action === 'approve' && (
              <p className="mt-2 text-[14px] text-cream-muted">This will verify the investor and grant them <strong className="text-amber">3 free starter credits</strong>. They will be notified.</p>
            )}

            {modal.action === 'reject' && (
              <div className="mt-4">
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Rejection reason (required)</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
                  className="w-full bg-white border border-[rgba(8,10,20,0.15)] rounded-[10px] px-4 py-3 text-[14px] text-cream focus:border-[rgba(8,10,20,0.45)] focus:outline-none resize-none transition-colors"
                  placeholder="Tell the investor why they were not approvedâ€¦" />
              </div>
            )}

            {modal.action === 'credits' && (
              <div className="mt-4">
                <label className="mb-1.5 block text-[12px] font-bold uppercase tracking-[0.10em] text-cream-subtle">Credit amount</label>
                <input type="number" min="0" max="999" value={creditsAmount} onChange={(e) => setCreditsAmount(e.target.value)}
                  className="w-full bg-white border border-[rgba(8,10,20,0.15)] rounded-[10px] px-4 py-3 text-[14px] text-cream focus:border-[rgba(8,10,20,0.45)] focus:outline-none transition-colors" />
              </div>
            )}

            {actionError && (
              <p className="mt-3 rounded-[8px] border border-[rgba(255,69,58,0.25)] bg-[rgba(255,69,58,0.10)] px-4 py-2.5 text-[13px] text-[#FF6B6B]">
                {actionError}
              </p>
            )}

            <div className="mt-5 flex gap-3">
              <button onClick={() => { setModal(null); setReason(''); setActionError('') }}
                className="flex-1 rounded-[10px] border border-[rgba(8,10,20,0.15)] py-2.5 text-[14px] font-bold text-[rgba(8,10,20,0.60)] hover:text-[#080A14] transition-colors cursor-pointer">
                Cancel
              </button>
              <button onClick={handleAction}
                disabled={acting || (modal.action === 'reject' && !reason.trim())}
                className={`flex-1 rounded-[10px] py-2.5 text-[14px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                  modal.action === 'approve' ? 'bg-[rgba(52,199,89,0.85)] text-white hover:bg-[#30D158]' :
                  modal.action === 'reject'  ? 'bg-[#FF453A] text-white hover:bg-[#ff6b6b]' :
                  'bg-[rgba(232,165,60,0.90)] text-navy hover:bg-amber'
                }`}>
                {acting ? 'Processingâ€¦' :
                 modal.action === 'approve' ? 'Approve & grant 3 credits' :
                 modal.action === 'reject'  ? 'Reject' : 'Set credits'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

