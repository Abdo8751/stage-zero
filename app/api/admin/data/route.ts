import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAdminSession } from '@/lib/admin-auth'
import { PRIVATE_JSON_HEADERS } from '@/lib/security'

export const dynamic = 'force-dynamic'

function svc() {
  const url    = process.env.NEXT_PUBLIC_SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !svcKey) throw new Error('Service key not configured')
  return createClient(url, svcKey, { auth: { persistSession: false } })
}

export async function GET(request: Request) {
  try {
    requireAdminSession()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: PRIVATE_JSON_HEADERS })
  }

  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const supabase = svc()

  try {
    if (type === 'investors') {
      const { data: investors, error } = await supabase
        .from('investors')
        .select('id, user_id, linkedin_url, cheque_size, location, bio, verification_status, credits, created_at')
        .order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: 'Failed to load investors' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

      // Deduplicate: already ordered by created_at DESC, keep first per user_id
      const seenUsers = new Set<string>()
      const uniqueInvestors = (investors ?? []).filter((inv) => {
        if (seenUsers.has(inv.user_id)) return false
        seenUsers.add(inv.user_id)
        return true
      })

      const userIds = uniqueInvestors.map((i) => i.user_id)
      const { data: users } = await supabase
        .from('users').select('id, full_name, email').in('id', userIds)
      const userMap = new Map((users ?? []).map((u) => [u.id, u]))

      const rows = uniqueInvestors.map((inv) => {
        const u = userMap.get(inv.user_id)
        return { ...inv, full_name: u?.full_name ?? null, email: u?.email ?? '' }
      })
      return NextResponse.json({ data: rows }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (type === 'startups') {
      const { data: startups, error } = await supabase
        .from('startups')
        .select('id, user_id, name, sector, stage, raise_amount, status, is_active, rejection_reason, created_at')
        .order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: 'Failed to load startups' }, { status: 500, headers: PRIVATE_JSON_HEADERS })

      const userIds = Array.from(new Set((startups ?? []).map((s) => s.user_id)))
      const { data: users } = await supabase
        .from('users').select('id, full_name, email').in('id', userIds)
      const userMap = new Map((users ?? []).map((u) => [u.id, u]))

      const rows = (startups ?? []).map((s) => {
        const u = userMap.get(s.user_id)
        return { ...s, founder_name: u?.full_name ?? null, founder_email: u?.email ?? '', founder_id: s.user_id }
      })
      return NextResponse.json({ data: rows }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (type === 'users') {
      const [{ data: usersData }, { data: startups }, { data: investors }] = await Promise.all([
        supabase.from('users').select('id, full_name, email, role, is_verified, is_banned, created_at').order('created_at', { ascending: false }),
        supabase.from('startups').select('id, user_id, name, tagline, sector, stage, status, raise_amount, website_url, is_active, created_at'),
        supabase.from('investors').select('id, user_id, verification_status, credits, cheque_size, location, linkedin_url'),
      ])

      const startupMap = new Map((startups ?? []).map((s) => [s.user_id, s]))
      const investorMap = new Map((investors ?? []).map((i) => [i.user_id, i]))

      const rows = (usersData ?? []).map((u) => ({
        ...u,
        startup:  startupMap.get(u.id) ?? null,
        investor: investorMap.get(u.id) ?? null,
      }))
      return NextResponse.json({ data: rows }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (type === 'stats') {
      const [
        { count: totalFounders },
        { count: totalInvestors },
        { count: totalMatches },
        { count: dealsClosed },
        { count: pendingStartups },
        { count: pendingInvestors },
        { data: recentUsers },
        { data: recentMatches },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'founder'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'investor'),
        supabase.from('matches').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true }).eq('is_deal_closed', true),
        supabase.from('startups').select('*', { count: 'exact', head: true }).eq('status', 'pending_review'),
        supabase.from('investors').select('*', { count: 'exact', head: true }).eq('verification_status', 'pending'),
        supabase.from('users').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(10),
        supabase.from('matches').select('id, status, created_at, startups(name), investors(users(full_name))').order('created_at', { ascending: false }).limit(10),
      ])
      return NextResponse.json({
        data: { totalFounders, totalInvestors, totalMatches, dealsClosed, pendingStartups, pendingInvestors, recentUsers, recentMatches }
      }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (type === 'matches') {
      const { data, error } = await supabase
        .from('matches')
        .select(`id, status, is_deal_closed, created_at,
          startups(name, user_id, users(full_name)),
          investors(users(full_name))`)
        .order('created_at', { ascending: false })
      if (error) return NextResponse.json({ error: 'Failed to load matches' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
      return NextResponse.json({ data: data ?? [] }, { headers: PRIVATE_JSON_HEADERS })
    }

    if (type === 'messages') {
      const { data, error } = await supabase
        .from('messages')
        .select(`id, content, created_at, match_id, sender_id, users(full_name)`)
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) return NextResponse.json({ error: 'Failed to load messages' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
      return NextResponse.json({ data: data ?? [] }, { headers: PRIVATE_JSON_HEADERS })
    }

    return NextResponse.json({ error: 'Unknown type' }, { status: 400, headers: PRIVATE_JSON_HEADERS })
  } catch (err) {
    return NextResponse.json({ error: 'Fetch failed' }, { status: 500, headers: PRIVATE_JSON_HEADERS })
  }
}
