import 'server-only'

import { createHmac, randomUUID, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'

export const ADMIN_SESSION_COOKIE = 'stage_zero_admin'
const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8

function getAdminSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET must be configured with at least 32 characters')
  }
  return secret
}

function sign(value: string) {
  return createHmac('sha256', getAdminSessionSecret()).update(value).digest('base64url')
}

export function verifyAdminPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) throw new Error('ADMIN_PASSWORD is not configured')

  const submitted = Buffer.from(password)
  const configured = Buffer.from(expected)
  return submitted.length === configured.length && timingSafeEqual(submitted, configured)
}

export function createAdminSessionCookieValue() {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS
  const nonce = randomUUID()
  const payload = `${expiresAt}.${nonce}`
  return `${payload}.${sign(payload)}`
}

export function isValidAdminSession(value: string | undefined) {
  if (!value) return false
  const parts = value.split('.')
  if (parts.length !== 3) return false

  const [expiresAt, nonce, signature] = parts
  const payload = `${expiresAt}.${nonce}`
  const expected = sign(payload)
  const receivedBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)

  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return false
  }

  const expiry = Number(expiresAt)
  return Number.isFinite(expiry) && expiry > Math.floor(Date.now() / 1000)
}

export function requireAdminSession() {
  const cookieValue = cookies().get(ADMIN_SESSION_COOKIE)?.value
  if (!isValidAdminSession(cookieValue)) {
    throw new Error('Unauthorized')
  }
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/admin',
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  }
}
