import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import * as Email from '@/lib/email'

/**
 * POST /api/notifications
 * Internal server-to-server endpoint called from admin and match flows.
 * Body: { userId, type, message, link?, emailFn?, emailArgs? }
 *
 * This single endpoint handles all notification + email triggers
 * so we don't need 9 separate route files.
 */
export async function POST(req: NextRequest) {
  const { userId, type, message, link, emailFn, emailArgs } = await req.json() as {
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
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  }

  const supabase = createServiceClient(url, svcKey, { auth: { persistSession: false } })

  // Insert DB notification
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, type, message, link: link ?? null })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Trigger email if requested
  if (emailFn && emailArgs) {
    await dispatchEmail(emailFn, emailArgs)
  }

  return NextResponse.json({ ok: true })
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
