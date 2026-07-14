import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'
import { requireAdminSession } from '@/lib/admin-auth'
import { PRIVATE_JSON_HEADERS, requireSameOrigin } from '@/lib/security'

export const dynamic = 'force-dynamic'

function svc() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

async function notify(userId: string, type: string, message: string, link: string, emailFn?: string, emailArgs?: Record<string, string>) {
  const internalSecret = process.env.INTERNAL_API_SECRET
  if (!internalSecret) return

  await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
    body: JSON.stringify({ userId, type, message, link, emailFn, emailArgs }),
  }).catch(() => { /* non-fatal */ })
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request)
    requireAdminSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
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
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (action === 'switchRole') {
      const { userId, newRole } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
      if (newRole !== 'founder' && newRole !== 'investor') return NextResponse.json({ error: 'Invalid role' }, { status: 400, headers: PRIVATE_JSON_HEADERS })

      await supabase.from('users').update({ role: newRole, is_verified: newRole === 'founder' }).eq('id', userId)

      if (newRole === 'investor') {
        const { data: existing } = await supabase.from('investors').select('id').eq('user_id', userId).maybeSingle()
        if (!existing) await supabase.from('investors').insert({ user_id: userId, verification_status: 'draft', credits: 0 })
      }
      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (action === 'ban' || action === 'unban') {
      const { userId } = body
      if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
      const { error } = await supabase.from('users').update({ is_banned: action === 'ban' }).eq('id', userId)
      if (error) return NextResponse.json({ error: 'User update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    /* ── Investor verification ──────────────────────────── */

    if (action === 'approveInvestor') {
      const { userId, investorId, investorEmail, investorName } = body
      if (!userId || !investorId) return NextResponse.json({ error: 'userId and investorId required' }, { status: 400, headers: PRIVATE_JSON_HEADERS })

      const { error: invErr } = await supabase.from('investors').update({ verification_status: 'approved', credits: 3 }).eq('id', investorId).eq('user_id', userId)
      if (invErr) return NextResponse.json({ error: 'Investor update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

      const { error: userErr } = await supabase.from('users').update({ is_verified: true }).eq('id', userId)
      if (userErr) return NextResponse.json({ error: 'User update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

      await notify(userId, 'investor_approved',
        'Your investor profile has been verified. You have 3 free credits to get started.',
        '/browse', 'sendInvestorApproved',
        { to: investorEmail ?? '', name: investorName ?? 'Investor' })

      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (action === 'rejectInvestor') {
      const { userId, investorId, reason, investorEmail, investorName } = body
      if (!userId || !investorId) return NextResponse.json({ error: 'userId and investorId required' }, { status: 400, headers: PRIVATE_JSON_HEADERS })

      const { error } = await supabase.from('investors').update({ verification_status: 'rejected' }).eq('id', investorId).eq('user_id', userId)
      if (error) return NextResponse.json({ error: 'Investor update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

      await supabase.from('users').update({ is_verified: false }).eq('id', userId)

      await notify(userId, 'investor_rejected',
        `Your investor verification was not approved. Reason: ${reason ?? ''}`,
        '/investor/verify', 'sendInvestorRejected',
        { to: investorEmail ?? '', name: investorName ?? 'Investor', reason: reason ?? '' })

      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (action === 'setCredits') {
      const { investorId, credits } = body
      const nextCredits = typeof credits === 'number' ? credits : Number.NaN
      if (!investorId || !Number.isInteger(nextCredits) || nextCredits < 0 || nextCredits > 1000) {
        return NextResponse.json({ error: 'Invalid credits update' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
      }
      const { error } = await supabase.from('investors').update({ credits: nextCredits }).eq('id', investorId)
      if (error) return NextResponse.json({ error: 'Credits update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    /* ── Startup moderation ─────────────────────────────── */

    if (action === 'approveStartup') {
      const { userId, startupId, startupName, founderEmail } = body
      if (!startupId || !userId) return NextResponse.json({ error: 'startupId and userId required' }, { status: 400, headers: PRIVATE_JSON_HEADERS })

      const { error } = await supabase.from('startups').update({ status: 'active', is_active: true, rejection_reason: null }).eq('id', startupId).eq('user_id', userId)
      if (error) return NextResponse.json({ error: 'Startup update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

      await notify(userId, 'startup_approved',
        `Your startup "${startupName}" has been approved and is now live!`,
        '/dashboard', 'sendStartupApproved',
        { to: founderEmail ?? '', startupName: startupName ?? '' })

      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (action === 'rejectStartup') {
      const { userId, startupId, startupName, founderEmail, reason } = body
      if (!startupId || !userId) return NextResponse.json({ error: 'startupId and userId required' }, { status: 400, headers: PRIVATE_JSON_HEADERS })

      const { error } = await supabase.from('startups').update({ status: 'rejected', is_active: false, rejection_reason: (reason ?? '').slice(0, 1000) || null }).eq('id', startupId).eq('user_id', userId)
      if (error) return NextResponse.json({ error: 'Startup update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

      await notify(userId, 'startup_rejected',
        `Your startup "${startupName}" was not approved. Reason: ${reason ?? ''}`,
        '/dashboard', 'sendStartupRejected',
        { to: founderEmail ?? '', startupName: startupName ?? '', reason: reason ?? '' })

      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (action === 'requestChanges') {
      const { userId, startupId, startupName, founderEmail, reason } = body
      if (!startupId || !userId) return NextResponse.json({ error: 'startupId and userId required' }, { status: 400, headers: PRIVATE_JSON_HEADERS })

      const { error } = await supabase.from('startups').update({ status: 'changes_requested', rejection_reason: (reason ?? '').slice(0, 1000) || null }).eq('id', startupId).eq('user_id', userId)
      if (error) return NextResponse.json({ error: 'Startup update failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

      await notify(userId, 'startup_changes_requested',
        `Changes requested for "${startupName}": ${reason ?? ''}`,
        '/profile/edit', 'sendStartupChangesRequested',
        { to: founderEmail ?? '', startupName: startupName ?? '', changes: reason ?? '' })

      return NextResponse.json({ success: true }, { headers: PRIVATE_JSON_HEADERS })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
  } catch (err) {
    return NextResponse.json({ error: 'Action failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}
