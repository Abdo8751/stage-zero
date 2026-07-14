import 'server-only'

import { createClient } from '@supabase/supabase-js'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/types'
import { getInvestorRoute } from '@/lib/auth'

export interface FinalizeProfileResult {
  role: UserRole
  nextRoute: string
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Supabase service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export function getConfirmedAt(user: SupabaseUser): string | null {
  return user.email_confirmed_at ?? user.confirmed_at ?? null
}

export async function finalizeProfileForUser(
  user: SupabaseUser,
  requestedRole?: UserRole | null,
): Promise<FinalizeProfileResult> {
  if (!getConfirmedAt(user)) {
    throw new Error('Email is not confirmed.')
  }

  const metadataRole = user.user_metadata?.role
  const role = requestedRole ?? (metadataRole === 'founder' || metadataRole === 'investor' ? metadataRole : null)

  if (role !== 'founder' && role !== 'investor') {
    throw new Error('A valid role is required.')
  }

  const supabase = getServiceClient()
  const fullName = (user.user_metadata?.full_name as string | undefined)?.trim() || user.email || null
  const { data: existingUser, error: lookupError } = await supabase
    .from('users')
    .select('id, email, role, full_name, avatar_url, is_verified, is_banned')
    .eq('id', user.id)
    .maybeSingle()

  if (lookupError) {
    throw new Error(`DB error: ${lookupError.message} (code: ${lookupError.code})`)
  }

  if (!existingUser) {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email ?? '',
        role,
        full_name: fullName,
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        is_verified: false,
        is_banned: false,
      })

    if (insertError) {
      throw new Error(`DB error: ${insertError.message} (code: ${insertError.code})`)
    }
  }

  if (role === 'investor') {
    const { data: existingInvestor, error: investorLookupError } = await supabase
      .from('investors')
      .select('id, verification_status, credits')
      .eq('user_id', user.id)
      .maybeSingle()

    if (investorLookupError) {
      throw new Error(`Investor lookup error: ${investorLookupError.message} (code: ${investorLookupError.code})`)
    }

    if (!existingInvestor) {
      const { error: investorError } = await supabase
        .from('investors')
        .insert({ user_id: user.id, verification_status: 'draft', credits: 0 })

      if (investorError) {
        throw new Error(`Investor DB error: ${investorError.message} (code: ${investorError.code})`)
      }
    }

    const { data: investor } = await supabase
      .from('investors')
      .select('verification_status')
      .eq('user_id', user.id)
      .maybeSingle()

    return {
      role,
      nextRoute: getInvestorRoute(investor?.verification_status),
    }
  }

  const { data: startup } = await supabase
    .from('startups')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return {
    role,
    nextRoute: startup ? '/dashboard' : '/onboarding',
  }
}
