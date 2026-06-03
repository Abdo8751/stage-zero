/**
 * Database-backed notification helpers.
 * Uses Supabase service role key on the server,
 * anon key on the client (RLS ensures users only read their own).
 */
import type { NotificationType, Notification } from '@/lib/types'

/* ── Server-side (API routes) ───────────────────────────────── */

function getServiceClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const svcKey  = process.env.SUPABASE_SERVICE_ROLE_KEY!
  // Dynamic import to avoid bundling server libs in client
  const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string,
  link?: string,
): Promise<void> {
  try {
    const supabase = getServiceClient()
    await supabase.from('notifications').insert({ user_id: userId, type, message, link: link ?? null })
  } catch {
    // Non-fatal — notification failure should not crash user flows
  }
}

/* ── Client-side hooks ──────────────────────────────────────── */

import { createClient } from '@/lib/supabase'

export async function getNotificationsDB(): Promise<Notification[]> {
  const supabase = createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []) as Notification[]
}

export async function markAllReadDB(): Promise<void> {
  const supabase = createClient()
  await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)
}

export async function markOneReadDB(id: string): Promise<void> {
  const supabase = createClient()
  await supabase.from('notifications').update({ is_read: true }).eq('id', id)
}

export async function getUnreadCountDB(): Promise<number> {
  const supabase = createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
  return count ?? 0
}
