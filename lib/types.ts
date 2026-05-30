export type UserRole = 'founder' | 'investor'

export type StartupStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b'

export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export type MatchStatus = 'pending' | 'accepted' | 'declined'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  is_verified: boolean
  created_at: string
}

export interface Startup {
  id: string
  user_id: string
  name: string
  tagline: string | null
  sector: string[]
  stage: StartupStage
  problem: string | null
  solution: string | null
  raise_amount: number | null
  pitch_deck_url: string | null
  website_url: string | null
  traction: string | null
  is_active: boolean
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

export interface UserInsert {
  id: string
  email: string
  role: UserRole
  full_name?: string | null
  avatar_url?: string | null
  is_verified?: boolean
}

export interface StartupInsert {
  user_id: string
  name: string
  tagline?: string | null
  sector?: string[]
  stage?: StartupStage
  problem?: string | null
  solution?: string | null
  raise_amount?: number | null
  pitch_deck_url?: string | null
  website_url?: string | null
  traction?: string | null
  is_active?: boolean
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
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
]

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
