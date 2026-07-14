import { createClient } from '@/lib/supabase'
import type { UserRole, VerificationStatus } from '@/lib/types'

const PENDING_VERIFICATION_EMAIL_KEY = 'stage_zero_pending_verification_email'

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

export function getNormalizedEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function getSiteOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? ''
}

export function getPasswordRecoveryRedirectUrl() {
  const origin = getSiteOrigin()
  return origin ? `${origin}/auth/callback?next=/reset-password` : '/auth/callback?next=/reset-password'
}

export function maskEmail(email: string): string {
  const normalized = getNormalizedEmail(email)
  const [localPart, domain] = normalized.split('@')
  if (!localPart || !domain) return normalized
  return `${localPart.slice(0, 1)}***@${domain}`
}

export async function sendPasswordResetEmail(email: string) {
  const supabase = createClient()
  return supabase.auth.resetPasswordForEmail(getNormalizedEmail(email), {
    redirectTo: getPasswordRecoveryRedirectUrl(),
  })
}

export function getPendingVerificationEmail(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY) ?? ''
}

export function setPendingVerificationEmail(email: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, getNormalizedEmail(email))
}

export function clearPendingVerificationEmail() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY)
}

export function isEmailConfirmationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const maybeError = error as { code?: string; status?: number; message?: string }
  return (
    maybeError.code === 'email_not_confirmed' ||
    maybeError.status === 403 ||
    /email.*not.*confirmed|confirmation.*required/i.test(String(maybeError.message ?? ''))
  )
}

export function getLoginRedirect(
  role: UserRole,
  investorStatus: VerificationStatus | null | undefined,
  hasStartup: boolean
): string {
  if (role === 'founder') {
    return hasStartup ? '/dashboard' : '/onboarding'
  }
  return getInvestorRoute(investorStatus, '/browse')
}

export type InvestorGuardRoute =
  | '/browse'
  | '/investor/verify'
  | '/investor/pending'
  | '/investor/verify?mode=resubmit'

export function getInvestorRoute(
  status: VerificationStatus | null | undefined,
  requestedPath: '/browse' | string = '/browse'
): string {
  switch (status) {
    case 'approved':
      return requestedPath === '/browse' ? '/browse' : requestedPath
    case 'pending':
      return '/investor/pending'
    case 'rejected':
      return '/investor/verify?mode=resubmit'
    case 'draft':
    default:
      return '/investor/verify'
  }
}

export function getInvestorProtectedRoute(status: VerificationStatus | null | undefined): Exclude<InvestorGuardRoute, '/browse'> | null {
  switch (status) {
    case 'approved':
      return null
    case 'pending':
      return '/investor/pending'
    case 'rejected':
      return '/investor/verify?mode=resubmit'
    case 'draft':
    default:
      return '/investor/verify'
  }
}

export async function uploadAvatar(userId: string, file: File): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

  if (!allowedTypes.has(file.type) || !['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    throw new Error('Avatar must be a JPG, PNG, or WebP image.')
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error('Avatar must be 2MB or smaller.')
  }

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
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (file.type !== 'application/pdf' || ext !== 'pdf') {
    throw new Error('Pitch deck must be a PDF.')
  }

  if (file.size > 20 * 1024 * 1024) {
    throw new Error('Pitch deck must be 20MB or smaller.')
  }

  const path = `${userId}/${crypto.randomUUID()}.pdf`

  const { error: uploadError } = await supabase.storage
    .from('pitch-decks')
    .upload(path, file, { upsert: true })

  if (uploadError) return null

  // Persist the object path, never a long-lived bearer URL. Approved investors
  // receive a short-lived URL from the authenticated detail route.
  return path
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
