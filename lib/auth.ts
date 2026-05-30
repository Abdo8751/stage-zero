import { createClient } from '@/lib/supabase'
import type { UserRole } from '@/lib/types'

export async function setupUserProfile(role: UserRole, email: string): Promise<string | null> {
  const response = await fetch('/api/auth/setup-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role, email }),
  })

  const result = (await response.json()) as { error?: string }
  if (!response.ok) {
    return result.error ?? 'Failed to create profile'
  }
  return null
}

export function getPostAuthRedirect(role: UserRole): string {
  return role === 'founder' ? '/onboarding' : '/investor/verify'
}

export function getLoginRedirect(
  role: UserRole,
  isVerified: boolean,
  investorApproved: boolean,
  hasStartup: boolean
): string {
  if (role === 'founder') {
    return hasStartup ? '/dashboard' : '/onboarding'
  }
  if (!isVerified || !investorApproved) return '/investor/verify'
  return '/browse'
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })

  if (uploadError) return null

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadPitchDeck(userId: string, file: File): Promise<string | null> {
  const supabase = createClient()
  const path = `${userId}/${Date.now()}-${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('pitch-decks')
    .upload(path, file, { upsert: true })

  if (uploadError) return null

  const { data, error: signError } = await supabase.storage
    .from('pitch-decks')
    .createSignedUrl(path, 60 * 60 * 24 * 365)

  if (signError) return path
  return data?.signedUrl ?? path
}

const SAVED_KEY = 'stage-zero-saved-startups'

export function getSavedStartupIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function toggleSavedStartup(id: string): string[] {
  const current = getSavedStartupIds()
  const next = current.includes(id) ? current.filter((s) => s !== id) : [...current, id]
  localStorage.setItem(SAVED_KEY, JSON.stringify(next))
  return next
}

export function isStartupSaved(id: string): boolean {
  return getSavedStartupIds().includes(id)
}

const NOTIFICATIONS_KEY = 'stage-zero-notifications'

export interface AppNotification {
  id: string
  type: 'interest' | 'message' | 'match_accepted' | 'match_declined'
  title: string
  body: string
  created_at: string
  is_read: boolean
}

export function getNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) ?? '[]') as AppNotification[]
  } catch {
    return []
  }
}

export function addNotification(notification: Omit<AppNotification, 'id' | 'created_at' | 'is_read'>) {
  const list = getNotifications()
  list.unshift({
    ...notification,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    is_read: false,
  })
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list.slice(0, 50)))
}

export function markAllNotificationsRead() {
  const list = getNotifications().map((n) => ({ ...n, is_read: true }))
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list))
}
