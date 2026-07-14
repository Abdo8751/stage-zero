import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import * as Email from '@/lib/email'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PRIVATE_JSON_HEADERS, requireSameOrigin } from '@/lib/security'

export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications
 * Internal server-to-server endpoint called from admin and match flows.
 * Body: { userId, type, message, link?, emailFn?, emailArgs? }
 *
 * This single endpoint handles all notification + email triggers
 * so we don't need 9 separate route files.
 */
export async function POST(req: NextRequest) {
  try {
    requireSameOrigin(req)
  } catch {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403, headers: PRIVATE_JSON_HEADERS })
  }

  const { userId, type, message, link, emailFn, emailArgs } = await req.json().catch(() => ({})) as {
    userId: string
    type: string
    message: string
    link?: string
    emailFn?: string
    emailArgs?: Record<string, string>
  }

  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !svcKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }

  if (!userId || !type || !message || message.length > 1000 || (link && link.length > 300)) {
    return NextResponse.json({ error: 'Invalid notification payload' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
  }

  const internalSecret = process.env.INTERNAL_API_SECRET
  const isInternal = Boolean(
    internalSecret &&
    req.headers.get('x-internal-secret') === internalSecret
  )

  if (!isInternal) {
    const supabaseForUser = createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseForUser.auth.getUser()

    if (!user || user.id !== userId || emailFn || emailArgs) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
    }
  }

  const supabase = createServiceClient(url, svcKey, { auth: { persistSession: false } })

  // Insert DB notification
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, message, link: link ?? null })

  if (error) {
    return NextResponse.json({ error: 'Notification failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }

  // Trigger email if requested
  if (emailFn && emailArgs) {
    await dispatchEmail(emailFn, emailArgs)
  }

  return NextResponse.json({ ok: true }, { headers: PRIVATE_JSON_HEADERS })
}

async function dispatchEmail(fn: string, args: Record<string, string>) {
  const a = args
  switch (fn) {
    case 'sendStartupSubmitted':       return Email.sendStartupSubmitted(a.to, a.startupName)
    case 'sendStartupApproved':        return Email.sendStartupApproved(a.to, a.startupName)
    case 'sendStartupRejected':        return Email.sendStartupRejected(a.to, a.startupName, a.reason)
    case 'sendStartupChangesRequested':return Email.sendStartupChangesRequested(a.to, a.startupName, a.changes)
    case 'sendInvestorApproved':       return Email.sendInvestorApproved(a.to, a.name)
    case 'sendInvestorRejected':       return Email.sendInvestorRejected(a.to, a.name, a.reason)
    case 'sendNewInterest':            return Email.sendNewInterest(a.to, a.founderName, a.investorName, a.startupName)
    case 'sendInterestAccepted':       return Email.sendInterestAccepted(a.to, a.investorName, a.startupName, a.matchId)
    case 'sendInterestDeclined':       return Email.sendInterestDeclined(a.to, a.investorName, a.startupName)
    case 'sendDealClosed':             return Email.sendDealClosed(a.to, a.name, a.startupName)
    case 'sendNewMessageNotification': return Email.sendNewMessageNotification(a.to, a.recipientName, a.senderName, a.matchId)
    case 'sendAdminNewStartup':        return Email.sendAdminNewStartup(a.to, a.founderName, a.startupName)
    case 'sendAdminNewInvestor':       return Email.sendAdminNewInvestor(a.to, a.investorName, a.email)
    default: break
  }
}
