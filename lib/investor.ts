import { createClient } from '@supabase/supabase-js'
import type { VerificationStatus } from '@/lib/types'

export interface InvestorProfile {
  id: string
  user_id: string
  verification_status: VerificationStatus
  linkedin_url: string | null
  bio: string | null
  cheque_size: string | null
  location: string | null
  credits: number
  created_at?: string
}

export function createServiceSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service key not configured')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export async function getInvestorProfileForUserId(userId: string): Promise<InvestorProfile | null> {
  const supabase = createServiceSupabaseClient()
  const { data, error } = await supabase
    .from('investors')
    .select('id, user_id, verification_status, linkedin_url, bio, cheque_size, location, credits, created_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Investor lookup error: ${error.message}`)
  }

  return (data as InvestorProfile | null) ?? null
}
