'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  RefreshCw, Search, Trash2, RefreshCcw, ShieldOff, ShieldCheck,
  ChevronDown, ChevronUp, ExternalLink, Rocket, Briefcase, X,
  AlertTriangle, Globe, TrendingUp, CheckCircle2,
} from 'lucide-react'
import type { UserRole } from '@/lib/types'

interface StartupInfo {
  id: string
  name: string
  tagline: string | null
  sector: string[]
  stage: string
  status: string
  raise_amount: number | null
  website_url: string | null
  is_active: boolean
  created_at: string
}

interface InvestorInfo {
  id: string
  verification_status: string
  credits: number
  cheque_size: string | null
  location: string | null
  linkedin_url: string | null
}

interface UserRow {
  id: string
  full_name: string | null
  email: string
  role: UserRole
  is_verified: boolean
  is_banned: boolean
  created_at: string
  startup: StartupInfo | null
  investor: InvestorInfo | null
}

type ModalState =
  | { type: 'switchRole'; user: UserRow; newRole: UserRole }
  | { type: 'delete'; user: UserRow }
  | { type: 'ban'; user: UserRow }
  | { type: 'startup'; startup: StartupInfo; userName: string }
  | null

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-EG', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRaise(n: number | null) {
  if (!n) return null
  return n >= 1_000_000 ? `EGP ${(n / 1_000_000).toFixed(1)}M` : `EGP ${(n / 1_000).toFixed(0)}K`
}

function stageName(s: string) {
  return { pre_seed: 'Pre-seed', seed: 'Seed', series_a: 'Series A', series_b: 'Series B+' }[s] ?? s
}

function RolePill({ role }: { role: UserRole }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] rounded-[4px] border ${
      role === 'founder'
        ? 'bg-[rgba(75,124,246,0.14)] text-blue-bright border-[rgba(75,124,246,0.28)]'
        : 'bg-[rgba(232,165,60,0.14)] text-amber border-[rgba(232,165,60,0.28)]'
    }`}>
      {role === 'founder' ? <Rocket className="h-2.5 w-2.5" /> : <Briefcase className="h-2.5 w-2.5" />}
      {role}
    </span>
  )
}

function StatusPill({ label, variant }: { label: string; variant: 'green' | 'amber' | 'red' | 'muted' }) {
  const v = {
    green: 'bg-[rgba(52,199,89,0.14)] text-[#30D158] border-[rgba(52,199,89,0.28)]',
    amber: 'bg-[rgba(232,165,60,0.14)] text-amber border-[rgba(232,165,60,0.28)]',
    red:   'bg-[rgba(255,69,58,0.14)] text-[#FF6B6B] border-[rgba(255,69,58,0.28)]',
    muted: 'bg-[rgba(8,10,20,0.06)] text-cream-subtle border-[rgba(8,10,20,0.14)]',
  }[variant]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] rounded-[4px] border ${v}`}>
      {label}
    </span>
  )
}

function StartupStatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'green' | 'amber' | 'red' | 'muted' }> = {
    active:             { label: 'Active',    variant: 'green' },
    pending_review:     { label: 'Pending',   variant: 'amber' },
    paused:             { label: 'Paused',    variant: 'muted' },
    rejected:           { label: 'Rejected',  variant: 'red' },
    changes_requested:  { label: 'Changes',   variant: 'amber' },
  }
  const { label, variant } = map[status] ?? { label: status, variant: 'muted' as const }
  return <StatusPill label={label} variant={variant} />
}

function Initials({ name, email }: { name: string | null; email: string }) {
  const str = name ?? email
  const initials = str.split(/\s|@/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(75,124,246,0.25)] to-[rgba(75,124,246,0.10)] border border-[rgba(75,124,246,0.25)] text-[11px] font-black text-blue-bright">
      {initials}
    </div>
  )
}

async function callAction(action: string, userId: string, extra?: Record<string, unknown>) {
  const res = await fetch('/api/admin/user-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, userId, ...extra }),
  })
  const data = await res.json() as { error?: string }
  if (!res.ok) throw new Error(data.error ?? 'Action failed')
}

export default function AdminUsersPage() {
  const [users, setUsers]       = useState<UserRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [roleFilter, setRoleFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modal, setModal]       = useState<ModalState>(null)
  const [acting, setActing]     = useState(false)
  const [actionError, setActionError] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/data?type=users')
    const json = await res.json() as { data?: UserRow[] }
    setUsers((json.data ?? []).map((u) => ({ ...u, role: u.role as UserRole, is_banned: u.is_banned ?? false })))
    setLoading(false)
  }, [])

  useEffect(() => { void fetchData() }, [fetchData])

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    const matchesSearch = !q
      || (u.full_name?.toLowerCase().includes(q) ?? false)
      || u.email.toLowerCase().includes(q)
      || (u.startup?.name.toLowerCase().includes(q) ?? false)
    const matchesRole = !roleFilter || u.role === roleFilter
    const matchesStatus = !statusFilter
      || (statusFilter === 'banned' && u.is_banned)
      || (statusFilter === 'active' && !u.is_banned)
      || (statusFilter === 'unverified' && !u.is_verified && !u.is_banned)
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleAction = async () => {
    if (!modal) return
    setActing(true)
    setActionError('')
    try {
      if (modal.type === 'delete') {
        await callAction('delete', modal.user.id)
      } else if (modal.type === 'switchRole') {
        await callAction('switchRole', modal.user.id, { newRole: modal.newRole })
      } else if (modal.type === 'ban') {
        await callAction(modal.user.is_banned ? 'unban' : 'ban', modal.user.id)
      }
      setModal(null)
      await fetchData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setActing(false)
    }
  }

  const pendingCount = users.filter((u) => !u.is_banned && (
    (u.role === 'founder' && u.startup?.status === 'pending_review') ||
    (u.role === 'investor' && u.investor?.verification_status === 'pending')
  )).length

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[26px] font-black tracking-tight text-cream">Users</h1>
          <p className="mt-1 text-[13px] text-cream-muted">
            {loading ? 'Loadingâ€¦' : (
              <>
                {filtered.length} of {users.length} users
                {pendingCount > 0 && <span className="ml-2 font-semibold text-amber">Â· {pendingCount} need action</span>}
              </>
            )}
          </p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="inline-flex items-center gap-2 border border-[rgba(8,10,20,0.12)] bg-[rgba(240,230,208,0.06)] px-4 py-2 rounded-[10px] text-[13px] font-medium text-cream-muted hover:text-cream hover:bg-[rgba(8,10,20,0.08)] transition-colors disabled:opacity-40 cursor-pointer">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cream-subtle pointer-events-none" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or startupâ€¦"
            className="w-full border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.05)] pl-9 pr-4 py-2.5 rounded-[10px] text-[13px] text-cream placeholder:text-cream-subtle focus:outline-none focus:border-[rgba(8,10,20,0.45)] transition-colors"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-[rgba(255,255,255,0.10)] bg-white px-4 py-2.5 rounded-[10px] text-[13px] text-cream focus:outline-none focus:border-[rgba(8,10,20,0.45)] transition-colors cursor-pointer [&>option]:bg-white">
          <option value="">All roles</option>
          <option value="founder">Founders</option>
          <option value="investor">Investors</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-[rgba(255,255,255,0.10)] bg-white px-4 py-2.5 rounded-[10px] text-[13px] text-cream focus:outline-none focus:border-[rgba(8,10,20,0.45)] transition-colors cursor-pointer [&>option]:bg-white">
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
          <option value="unverified">Unverified</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(8,10,20,0.10)] text-[10px] tracking-[0.14em] uppercase text-cream-subtle font-medium">
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Startup / Profile</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(8,10,20,0.08)]">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 w-full rounded shimmer" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-[13px] text-cream-subtle">
                    No users match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <>
                    <tr
                      key={u.id}
                      className={`transition-colors ${u.is_banned ? 'bg-[rgba(255,69,58,0.04)]' : 'hover:bg-[rgba(8,10,20,0.03)]'}`}
                    >
                      {/* Expand toggle */}
                      <td className="px-4 py-3.5">
                        {(u.startup || u.investor) && (
                          <button
                            type="button"
                            onClick={() => setExpanded(expanded === u.id ? null : u.id)}
                            className="flex h-6 w-6 items-center justify-center rounded-[6px] text-cream-subtle hover:text-cream hover:bg-[rgba(240,230,208,0.08)] transition-colors cursor-pointer"
                          >
                            {expanded === u.id
                              ? <ChevronUp className="h-3.5 w-3.5" />
                              : <ChevronDown className="h-3.5 w-3.5" />
                            }
                          </button>
                        )}
                      </td>

                      {/* User */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <Initials name={u.full_name} email={u.email} />
                          <div className="min-w-0">
                            <p className="text-[13px] font-semibold text-cream truncate">{u.full_name ?? 'â€”'}</p>
                            <p className="text-[11px] text-cream-subtle truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5"><RolePill role={u.role} /></td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {u.is_banned
                            ? <StatusPill label="Banned" variant="red" />
                            : u.is_verified
                              ? <StatusPill label="Verified" variant="green" />
                              : <StatusPill label="Unverified" variant="muted" />
                          }
                        </div>
                      </td>

                      {/* Startup / profile summary */}
                      <td className="px-4 py-3.5">
                        {u.role === 'founder' && u.startup ? (
                          <button
                            type="button"
                            onClick={() => setModal({ type: 'startup', startup: u.startup!, userName: u.full_name ?? u.email })}
                            className="flex items-center gap-1.5 text-[12px] font-medium text-blue-bright hover:underline cursor-pointer"
                          >
                            {u.startup.name}
                            <StartupStatusPill status={u.startup.status} />
                          </button>
                        ) : u.role === 'investor' && u.investor ? (
                          <span className="text-[12px] text-cream-muted capitalize">
                            {u.investor.verification_status}
                            {u.investor.credits > 0 && <span className="ml-1.5 text-amber font-semibold">{u.investor.credits} cr</span>}
                          </span>
                        ) : (
                          <span className="text-[12px] text-cream-subtle">â€”</span>
                        )}
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3.5 text-[12px] text-cream-subtle whitespace-nowrap">
                        {formatDate(u.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Switch role */}
                          <button
                            type="button"
                            title={`Switch to ${u.role === 'founder' ? 'investor' : 'founder'}`}
                            onClick={() => setModal({ type: 'switchRole', user: u, newRole: u.role === 'founder' ? 'investor' : 'founder' })}
                            className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[rgba(232,165,60,0.12)] text-amber hover:bg-[rgba(232,165,60,0.22)] transition-colors cursor-pointer"
                          >
                            <RefreshCcw className="h-3.5 w-3.5" />
                          </button>

                          {/* Ban / Unban */}
                          <button
                            type="button"
                            title={u.is_banned ? 'Unban user' : 'Ban user'}
                            onClick={() => setModal({ type: 'ban', user: u })}
                            className={`flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors cursor-pointer ${
                              u.is_banned
                                ? 'bg-[rgba(52,199,89,0.12)] text-[#30D158] hover:bg-[rgba(52,199,89,0.22)]'
                                : 'bg-[rgba(255,69,58,0.10)] text-[#FF6B6B] hover:bg-[rgba(255,69,58,0.20)]'
                            }`}
                          >
                            {u.is_banned ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete user"
                            onClick={() => setModal({ type: 'delete', user: u })}
                            className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-[rgba(255,69,58,0.08)] text-[#FF453A] hover:bg-[rgba(255,69,58,0.18)] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row â€” detailed profile */}
                    {expanded === u.id && (
                      <tr key={`${u.id}-expanded`} className="bg-[rgba(240,230,208,0.02)]">
                        <td colSpan={7} className="px-6 py-4 border-b border-[rgba(8,10,20,0.10)]">
                          {u.role === 'founder' && u.startup ? (
                            <FounderDetail startup={u.startup} onView={() => setModal({ type: 'startup', startup: u.startup!, userName: u.full_name ?? u.email })} />
                          ) : u.role === 'investor' && u.investor ? (
                            <InvestorDetail investor={u.investor} />
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* â”€â”€ Modals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {modal && modal.type !== 'startup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl border border-[rgba(8,10,20,0.12)] bg-[rgba(255,255,255,0.97)] p-6 shadow-2xl">

            {/* Header */}
            <div className="flex items-start gap-3 mb-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${
                modal.type === 'delete' ? 'bg-[rgba(255,69,58,0.12)] border border-[rgba(255,69,58,0.22)]' :
                modal.type === 'ban'    ? 'bg-[rgba(255,69,58,0.12)] border border-[rgba(255,69,58,0.22)]' :
                'bg-[rgba(232,165,60,0.12)] border border-[rgba(232,165,60,0.22)]'
              }`}>
                {modal.type === 'delete' ? <Trash2 className="h-4.5 w-4.5 text-[#FF453A]" /> :
                 modal.type === 'ban'    ? <AlertTriangle className="h-4.5 w-4.5 text-amber" /> :
                 <RefreshCcw className="h-4.5 w-4.5 text-amber" />}
              </div>
              <div>
                <h2 className="text-[17px] font-black text-cream">
                  {modal.type === 'delete'     ? `Delete ${modal.user.full_name ?? modal.user.email}?` :
                   modal.type === 'ban'        ? `${modal.user.is_banned ? 'Unban' : 'Ban'} ${modal.user.full_name ?? modal.user.email}?` :
                   `Switch to ${modal.newRole}?`}
                </h2>
                <p className="mt-1 text-[13px] text-cream-muted leading-relaxed">
                  {modal.type === 'delete'
                    ? 'This permanently deletes the account, all their data, and cannot be undone.'
                    : modal.type === 'ban'
                      ? modal.user.is_banned
                        ? 'The user will regain access to the platform immediately.'
                        : 'The user will be locked out of the platform immediately.'
                      : `${modal.user.full_name ?? 'This user'} will be switched from ${modal.user.role} to ${modal.newRole}. Their existing data stays intact.`
                  }
                </p>
              </div>
            </div>

            {actionError && (
              <p className="mb-4 rounded-[8px] border border-[rgba(255,69,58,0.25)] bg-[rgba(255,69,58,0.10)] px-4 py-2.5 text-[13px] text-[#FF6B6B]">
                {actionError}
              </p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => { setModal(null); setActionError('') }}
                className="flex-1 rounded-[10px] border border-[rgba(8,10,20,0.15)] py-2.5 text-[14px] font-bold text-[rgba(8,10,20,0.60)] hover:text-[#080A14] transition-colors cursor-pointer">
                Cancel
              </button>
              <button type="button" onClick={handleAction} disabled={acting}
                className={`flex-1 rounded-[10px] py-2.5 text-[14px] font-bold transition-colors cursor-pointer disabled:opacity-50 ${
                  modal.type === 'delete'                          ? 'bg-[#FF453A] text-white hover:bg-[#ff6b6b]' :
                  modal.type === 'ban' && !modal.user.is_banned    ? 'bg-[rgba(255,69,58,0.80)] text-white hover:bg-[#FF453A]' :
                  modal.type === 'ban' && modal.user.is_banned     ? 'bg-[rgba(52,199,89,0.80)] text-white hover:bg-[#30D158]' :
                  'bg-[rgba(232,165,60,0.90)] text-navy hover:bg-amber'
                }`}>
                {acting ? 'Processingâ€¦' :
                 modal.type === 'delete' ? 'Delete permanently' :
                 modal.type === 'ban'    ? (modal.user.is_banned ? 'Unban user' : 'Ban user') :
                 `Switch to ${modal.newRole}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Startup detail modal */}
      {modal?.type === 'startup' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg rounded-2xl border border-[rgba(8,10,20,0.12)] bg-[rgba(255,255,255,0.97)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-cream-subtle">Startup listing</p>
                <h2 className="mt-1 text-[20px] font-black tracking-tight text-cream">{modal.startup.name}</h2>
                <p className="text-[12px] text-cream-muted">By {modal.userName}</p>
              </div>
              <button type="button" onClick={() => setModal(null)}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] text-cream-subtle hover:text-cream hover:bg-[rgba(240,230,208,0.08)] transition-colors cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Meta row */}
              <div className="flex flex-wrap gap-2 items-center">
                <StartupStatusPill status={modal.startup.status} />
                <span className="text-[11px] text-cream-subtle capitalize">{stageName(modal.startup.stage)}</span>
                {modal.startup.sector.map((s) => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[rgba(240,230,208,0.07)] text-cream-subtle border border-[rgba(240,230,208,0.10)]">{s}</span>
                ))}
              </div>

              {modal.startup.tagline && (
                <p className="text-[14px] text-cream-muted italic">&ldquo;{modal.startup.tagline}&rdquo;</p>
              )}

              {/* Raise */}
              {modal.startup.raise_amount && (
                <div className="flex items-center gap-2 rounded-[10px] border border-[rgba(232,165,60,0.20)] bg-[rgba(232,165,60,0.06)] px-4 py-3">
                  <TrendingUp className="h-4 w-4 text-amber shrink-0" />
                  <span className="text-[14px] font-bold text-amber">Raising {formatRaise(modal.startup.raise_amount)}</span>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-3">
                {modal.startup.website_url && (
                  <a href={modal.startup.website_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[13px] text-blue-bright hover:underline">
                    <Globe className="h-3.5 w-3.5" />Website <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {modal.startup.is_active && (
                  <span className="flex items-center gap-1.5 text-[13px] text-[#30D158]">
                    <CheckCircle2 className="h-3.5 w-3.5" />Live
                  </span>
                )}
              </div>

              <p className="text-[11px] text-cream-subtle">Listed {formatDate(modal.startup.created_at)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FounderDetail({ startup, onView }: { startup: StartupInfo; onView: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[rgba(75,124,246,0.12)] border border-[rgba(75,124,246,0.22)] text-blue-bright font-black text-[14px]">
          {startup.name[0]}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-cream">{startup.name}</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <StartupStatusPill status={startup.status} />
            <span className="text-[11px] text-cream-subtle">{stageName(startup.stage)}</span>
            {startup.raise_amount && <span className="text-[11px] text-amber font-semibold">{formatRaise(startup.raise_amount)}</span>}
          </div>
        </div>
      </div>
      {startup.sector.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {startup.sector.slice(0, 3).map((s) => (
            <span key={s} className="text-[10px] px-2 py-0.5 rounded-[4px] bg-[rgba(240,230,208,0.06)] text-cream-subtle border border-[rgba(240,230,208,0.10)]">{s}</span>
          ))}
        </div>
      )}
      <button type="button" onClick={onView}
        className="ml-auto flex items-center gap-1.5 text-[12px] text-blue-bright hover:underline cursor-pointer">
        View full listing <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  )
}

function InvestorDetail({ investor }: { investor: InvestorInfo }) {
  return (
    <div className="flex flex-wrap gap-6 text-[12px]">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-cream-subtle mb-1">Verification</p>
        <span className={`capitalize font-semibold ${
          investor.verification_status === 'approved' ? 'text-[#30D158]' :
          investor.verification_status === 'rejected' ? 'text-[#FF6B6B]' : 'text-amber'
        }`}>{investor.verification_status}</span>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-cream-subtle mb-1">Credits</p>
        <span className="font-bold text-amber">{investor.credits}</span>
      </div>
      {investor.cheque_size && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-cream-subtle mb-1">Cheque size</p>
          <span className="text-cream-muted">{investor.cheque_size}</span>
        </div>
      )}
      {investor.location && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-cream-subtle mb-1">Location</p>
          <span className="text-cream-muted">{investor.location}</span>
        </div>
      )}
      {investor.linkedin_url && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.10em] text-cream-subtle mb-1">LinkedIn</p>
          <a href={investor.linkedin_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-blue-bright hover:underline">
            Profile <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      )}
    </div>
  )
}

