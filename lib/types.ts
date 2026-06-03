export type UserRole = 'founder' | 'investor'

export type StartupStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b'

export type StartupStatus =
  | 'pending_review'
  | 'active'
  | 'paused'
  | 'rejected'
  | 'changes_requested'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export type MatchStatus = 'pending' | 'accepted' | 'declined' | 'expired'

export type NotificationType =
  | 'new_interest'
  | 'interest_accepted'
  | 'interest_declined'
  | 'new_message'
  | 'startup_approved'
  | 'startup_rejected'
  | 'startup_changes_requested'
  | 'investor_approved'
  | 'investor_rejected'
  | 'deal_closed'
  | 'match_accepted'
  | 'match_declined'
  | 'interest'
  | 'message'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean
  is_banned: boolean
  created_at: string
}

export interface Startup {
  id: string
  user_id: string
  name: string
  tagline: string | null
  sector: string[]
  stage: StartupStage
  status: StartupStatus
  rejection_reason: string | null
  problem: string | null
  solution: string | null
  raise_amount: number | null
  pitch_deck_url: string | null
  website_url: string | null
  traction: string | null
  is_active: boolean
  is_featured: boolean
  view_count: number
  created_at: string
}

export interface Investor {
  id: string
  user_id: string
  linkedin_url: string | null
  bio: string | null
  cheque_size: string | null
  location: string | null
  verification_status: VerificationStatus
  credits: number
  created_at: string
}

export interface Match {
  id: string
  startup_id: string
  investor_id: string
  status: MatchStatus
  is_deal_closed: boolean
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  message: string
  link: string | null
  is_read: boolean
  created_at: string
}

export interface SavedStartup {
  id: string
  investor_id: string
  startup_id: string
  created_at: string
}

export interface Report {
  id: string
  reporter_id: string
  reported_user_id: string
  match_id: string | null
  reason: string
  is_resolved: boolean
  created_at: string
}

export interface UserInsert {
  id: string
  email: string
  role: UserRole
  full_name?: string | null
  avatar_url?: string | null
  is_verified?: boolean
  is_banned?: boolean
}

export interface StartupInsert {
  user_id: string
  name: string
  tagline?: string | null
  sector?: string[]
  stage?: StartupStage
  status?: StartupStatus
  problem?: string | null
  solution?: string | null
  raise_amount?: number | null
  pitch_deck_url?: string | null
  website_url?: string | null
  traction?: string | null
  is_active?: boolean
  is_featured?: boolean
}

export interface InvestorInsert {
  user_id: string
  linkedin_url?: string | null
  bio?: string | null
  cheque_size?: string | null
  location?: string | null
  verification_status?: VerificationStatus
  credits?: number
}

export interface MatchInsert {
  startup_id: string
  investor_id: string
  status?: MatchStatus
  is_deal_closed?: boolean
}

export interface MessageInsert {
  match_id: string
  sender_id: string
  content: string
  is_read?: boolean
}

export interface StartupWithFounder extends Startup {
  users: Pick<User, 'full_name' | 'avatar_url' | 'email'> | null
}

export interface MatchWithDetails extends Match {
  startups: StartupWithFounder | null
  investors: (Investor & { users: Pick<User, 'full_name' | 'avatar_url'> | null }) | null
}

export interface MessageWithSender extends Message {
  users: Pick<User, 'full_name' | 'avatar_url'> | null
}

export const STARTUP_STAGES: { value: StartupStage; label: string }[] = [
  { value: 'pre_seed', label: 'Pre-seed' },
  { value: 'seed',     label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
]

export const STARTUP_STATUS_LABELS: Record<StartupStatus, string> = {
  pending_review:     'Pending review',
  active:             'Active',
  paused:             'Paused',
  rejected:           'Rejected',
  changes_requested:  'Changes requested',
}

export const SECTORS = [
  'Fintech',
  'Healthtech',
  'Edtech',
  'E-commerce',
  'Logistics',
  'Agtech',
  'Proptech',
  'SaaS',
  'AI / ML',
  'Consumer',
  'Other',
] as const

export type Sector = (typeof SECTORS)[number]
