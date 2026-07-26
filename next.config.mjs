function getSupabaseEndpoint() {
  const configuredUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!configuredUrl) return null

  try {
    const url = new URL(configuredUrl)
    if (url.protocol !== 'https:') return null
    return { hostname: url.hostname, origin: url.origin }
  } catch {
    return null
  }
}

const supabaseEndpoint = getSupabaseEndpoint()

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: supabaseEndpoint
      ? [{ protocol: 'https', hostname: supabaseEndpoint.hostname }]
      : [],
  },
  async headers() {
    const imageSources = ["'self'", 'data:', 'blob:']
    const connectSources = ["'self'", 'https://api.resend.com']
    if (supabaseEndpoint) {
      imageSources.push(supabaseEndpoint.origin)
      connectSources.push(supabaseEndpoint.origin)
    }

    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      `img-src ${imageSources.join(' ')}`,
      `connect-src ${connectSources.join(' ')}`,
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-inline'",
      "form-action 'self'",
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy-Report-Only', value: csp },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ]
  },
}

export default nextConfig
