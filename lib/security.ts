export const PRIVATE_JSON_HEADERS = {
  'Cache-Control': 'no-store, private, max-age=0',
  'X-Content-Type-Options': 'nosniff',
}

export function jsonError(message: string, status = 500) {
  return Response.json({ error: message }, { status, headers: PRIVATE_JSON_HEADERS })
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin')
  if (!origin) return true

  const requestUrl = new URL(request.url)
  return origin === requestUrl.origin
}

export function requireSameOrigin(request: Request) {
  if (!isSameOriginRequest(request)) {
    throw new Error('Invalid request origin')
  }
}

export function isSafeAppPath(value: string | null | undefined): value is string {
  if (!value) return false
  if (!value.startsWith('/')) return false
  if (value.startsWith('//')) return false
  if (value.includes('\\')) return false
  try {
    const parsed = new URL(value, 'https://stagezero.local')
    return parsed.origin === 'https://stagezero.local'
  } catch {
    return false
  }
}

export function sanitizeAppRedirect(value: string | null | undefined, fallback: string) {
  return isSafeAppPath(value) ? value : fallback
}
