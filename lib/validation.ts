export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(email: string): string | null {
  const trimmed = email.trim()
  if (!trimmed) return 'Email is required'
  if (!EMAIL_REGEX.test(trimmed)) return 'Enter a valid email address'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  return null
}

export function validateRequired(value: string, fieldName: string): string | null {
  if (!value.trim()) return `${fieldName} is required`
  return null
}

export function validateUrl(url: string, fieldName: string): string | null {
  if (!url.trim()) return null
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`)
    return null
  } catch {
    return `Enter a valid ${fieldName} URL`
  }
}
