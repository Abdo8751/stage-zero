/**
 * Client-side helper: create a DB notification + trigger email
 * via the /api/notifications server route.
 *
 * All calls are fire-and-forget — failures are logged but never thrown.
 */
export async function notify(
  userId: string,
  type: string,
  message: string,
  link?: string,
  emailFn?: string,
  emailArgs?: Record<string, string>,
): Promise<void> {
  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, message, link, emailFn, emailArgs }),
    })
  } catch {
    // Non-fatal
  }
}
