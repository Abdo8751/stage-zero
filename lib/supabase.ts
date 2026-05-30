import { createBrowserClient } from '@supabase/ssr'

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase env vars. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local'
    )
  }

  if (anonKey.startsWith('sb_secret_') || anonKey.includes('service_role')) {
    throw new Error(
      'Forbidden: you are using a secret/service_role key. Use the anon public key from Supabase → Project Settings → API.'
    )
  }

  return { url, anonKey }
}

export function createClient() {
  const { url, anonKey } = getSupabaseEnv()
  return createBrowserClient(url, anonKey)
}
