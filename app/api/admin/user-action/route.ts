import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'

function requireAdmin() {
  const adminAuth = cookies().get('admin_auth')?.value
  if (adminAuth !== 'true') throw new Error('Unauthorized')
}

function svc() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

async function notify(userId: string, type: string, message: string, link: string, emailFn?: string, emailArgs?: Record<string, string>) {
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, type, message, link, emailFn, emailArgs }),
  }).catch(() => { /* non-fatal */ })
}

export async function POST(request: Request) {
  try { requireAdmin() } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json() as {
      action: string
      userId?: string
      investorId?: string
      startupId?: string
      newRole?: UserRole
      reason?: string
      credits?: number
      founderEmail?: string
      startupName?: string
      investorEmail?: string
      investorName?: string
    }
    const { action } = body
    const supabase = svc()

    /* ── User-level actions ─────────────────────────────── */

    if (action === 'delete') {
      const { userId } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'switchRole') {
      const { userId, newRole } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
      if (newRole !== 'founder' && newRole !== 'investor') return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

      await supabase.from('users').update({ role: newRole, is_verified: newRole === 'founder' }).eq('id', userId)

      if (newRole === 'investor') {
        const { data: existing } = await supabase.from('investors').select('id').eq('user_id', userId).maybeSingle()
        if (!existing) await supabase.from('investors').insert({ user_id: userId, verification_status: 'pending', credits: 0 })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'ban' || action === 'unban') {
      const { userId } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
      const { error } = await supabase.from('users').update({ is_banned: action === 'ban' }).eq('id', userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    /* ── Investor verification ──────────────────────────── */

    if (action === 'approveInvestor') {
      const { userId, investorId, investorEmail, investorName } = body
      if (!userId || !investorId) return NextResponse.json({ error: 'userId and investorId required' }, { status: 400 })

      const { error: invErr } = await supabase.from('investors').update({ verification_status: 'approved', credits: 3 }).eq('id', investorId)
      if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 })

      const { error: userErr } = await supabase.from('users').update({ is_verified: true }).eq('id', userId)
      if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })

      await notify(userId, 'investor_approved',
        'Your investor profile has been verified. You have 3 free credits to get started.',
        '/browse', 'sendInvestorApproved',
        { to: investorEmail ?? '', name: investorName ?? 'Investor' })

      return NextResponse.json({ success: true })
    }

    if (action === 'rejectInvestor') {
      const { userId, investorId, reason, investorEmail, investorName } = body
      if (!userId || !investorId) return NextResponse.json({ error: 'userId and investorId required' }, { status: 400 })

      const { error } = await supabase.from('investors').update({ verification_status: 'rejected' }).eq('id', investorId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await supabase.from('users').update({ is_verified: false }).eq('id', userId)

      await notify(userId, 'investor_rejected',
        `Your investor verification was not approved. Reason: ${reason ?? ''}`,
        '/investor/verify', 'sendInvestorRejected',
        { to: investorEmail ?? '', name: investorName ?? 'Investor', reason: reason ?? '' })

      return NextResponse.json({ success: true })
    }

    if (action === 'setCredits') {
      const { investorId, credits } = body
      if (!investorId) return NextResponse.json({ error: 'investorId required' }, { status: 400 })
      const { error } = await supabase.from('investors').update({ credits: credits ?? 0 }).eq('id', investorId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    /* ── Startup moderation ─────────────────────────────── */

    if (action === 'approveStartup') {
      const { userId, startupId, startupName, founderEmail } = body
      if (!startupId || !userId) return NextResponse.json({ error: 'startupId and userId required' }, { status: 400 })

      const { error } = await supabase.from('startups').update({ status: 'active', is_active: true, rejection_reason: null }).eq('id', startupId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await notify(userId, 'startup_approved',
        `Your startup "${startupName}" has been approved and is now live!`,
        '/dashboard', 'sendStartupApproved',
        { to: founderEmail ?? '', startupName: startupName ?? '' })

      return NextResponse.json({ success: true })
    }

    if (action === 'rejectStartup') {
      const { userId, startupId, startupName, founderEmail, reason } = body
      if (!startupId || !userId) return NextResponse.json({ error: 'startupId and userId required' }, { status: 400 })

      const { error } = await supabase.from('startups').update({ status: 'rejected', is_active: false, rejection_reason: reason ?? null }).eq('id', startupId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await notify(userId, 'startup_rejected',
        `Your startup "${startupName}" was not approved. Reason: ${reason ?? ''}`,
        '/dashboard', 'sendStartupRejected',
        { to: founderEmail ?? '', startupName: startupName ?? '', reason: reason ?? '' })

      return NextResponse.json({ success: true })
    }

    if (action === 'requestChanges') {
      const { userId, startupId, startupName, founderEmail, reason } = body
      if (!startupId || !userId) return NextResponse.json({ error: 'startupId and userId required' }, { status: 400 })

      const { error } = await supabase.from('startups').update({ status: 'changes_requested', rejection_reason: reason ?? null }).eq('id', startupId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await notify(userId, 'startup_changes_requested',
        `Changes requested for "${startupName}": ${reason ?? ''}`,
        '/profile/edit', 'sendStartupChangesRequested',
        { to: founderEmail ?? '', startupName: startupName ?? '', changes: reason ?? '' })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Action failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
