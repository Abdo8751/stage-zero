/**
 * Transactional email helpers using Resend.
 * All functions are no-ops if RESEND_API_KEY is not set,
 * so the app works locally without email configured.
 */

const FROM = 'Stage Zero <noreply@stagezero.eg>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stagezero.eg'

function emailShell(body: string, ctaText?: string, ctaUrl?: string) {
  const cta = ctaText && ctaUrl
    ? `<div style="text-align:center;margin:32px 0;">
         <a href="${ctaUrl}" style="
           display:inline-block;
           background:linear-gradient(180deg,#F5EDDB 0%,#DDD0B4 100%);
           color:#040B1A;
           font-weight:700;
           font-size:14px;
           padding:12px 28px;
           border-radius:10px;
           text-decoration:none;
           border:1px solid rgba(255,255,255,0.35);
         ">${ctaText}</a>
       </div>`
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#040B1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:rgba(6,14,36,0.95);border:1px solid rgba(240,230,208,0.14);border-radius:20px;overflow:hidden;">
        <tr><td style="padding:32px 40px 0;">
          <p style="margin:0 0 24px;font-size:15px;font-weight:900;letter-spacing:-.04em;color:#F0E6D0;text-transform:uppercase;">STAGE ZERO</p>
          <hr style="border:none;border-top:1px solid rgba(240,230,208,0.08);margin-bottom:28px;"/>
          ${body}
          ${cta}
          <hr style="border:none;border-top:1px solid rgba(240,230,208,0.06);margin:28px 0 20px;"/>
          <p style="margin:0 0 32px;font-size:11px;color:rgba(240,230,208,0.35);text-align:center;">
            Egypt's investor marketplace · <a href="${APP_URL}" style="color:rgba(240,230,208,0.35);">stagezero.eg</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

function p(text: string, muted = false) {
  const color = muted ? 'rgba(240,230,208,0.60)' : '#F0E6D0'
  return `<p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:${color};">${text}</p>`
}

function h1(text: string) {
  return `<h1 style="margin:0 0 20px;font-size:24px;font-weight:900;letter-spacing:-.035em;color:#F0E6D0;">${text}</h1>`
}

function highlight(text: string) {
  return `<span style="color:#E8A53C;font-weight:700;">${text}</span>`
}

async function send(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) return // graceful no-op locally

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    })
  } catch {
    // Non-fatal — email failure should never crash a user flow
  }
}

/* ── Public email functions ──────────────────────────────── */

export async function sendStartupSubmitted(to: string, startupName: string) {
  await send(
    to,
    `Your startup "${startupName}" is under review`,
    emailShell(
      h1('Submission received') +
      p(`Thank you for submitting ${highlight(startupName)} to Stage Zero.`) +
      p('Our team will review your listing within 2–3 business days. You\'ll receive an email as soon as a decision is made.', true) +
      p('In the meantime, you can log in to update your profile or pitch deck.', true),
      'View your dashboard',
      `${APP_URL}/dashboard`,
    ),
  )
}

export async function sendStartupApproved(to: string, startupName: string) {
  await send(
    to,
    `🎉 Your startup "${startupName}" is now live`,
    emailShell(
      h1('You\'re live on Stage Zero') +
      p(`Great news — ${highlight(startupName)} has been approved and is now visible to verified investors.`) +
      p('Keep your profile up to date, respond quickly to investor interest, and good luck!', true),
      'View your listing',
      `${APP_URL}/dashboard`,
    ),
  )
}

export async function sendStartupRejected(to: string, startupName: string, reason: string) {
  await send(
    to,
    `Update on your Stage Zero submission`,
    emailShell(
      h1('Submission not approved') +
      p(`Unfortunately, ${highlight(startupName)} was not approved at this time.`) +
      p(`<strong style="color:#F0E6D0;">Reason:</strong> ${reason}`) +
      p('You can edit your listing and resubmit for review. Our team reviews all resubmissions.', true),
      'Edit and resubmit',
      `${APP_URL}/profile/edit`,
    ),
  )
}

export async function sendStartupChangesRequested(to: string, startupName: string, changes: string) {
  await send(
    to,
    `Changes requested for "${startupName}"`,
    emailShell(
      h1('Changes needed') +
      p(`Our team reviewed ${highlight(startupName)} and needs a few updates before approval.`) +
      p(`<strong style="color:#F0E6D0;">Requested changes:</strong> ${changes}`) +
      p('Once you\'ve made the updates, resubmit from your dashboard.', true),
      'Edit your listing',
      `${APP_URL}/profile/edit`,
    ),
  )
}

export async function sendInvestorApproved(to: string, name: string) {
  await send(
    to,
    `Welcome to Stage Zero — you're verified`,
    emailShell(
      h1(`You're in, ${name}`) +
      p('Your investor profile has been verified. You now have access to the full Stage Zero network.') +
      p(`You've been given ${highlight('3 free credits')} to get started — use them to express interest in startups you believe in.`, true),
      'Start browsing',
      `${APP_URL}/browse`,
    ),
  )
}

export async function sendInvestorRejected(to: string, name: string, reason: string) {
  await send(
    to,
    `Your Stage Zero verification`,
    emailShell(
      h1(`Hi ${name}`) +
      p('We\'ve reviewed your investor profile and are unable to approve it at this time.') +
      p(`<strong style="color:#F0E6D0;">Reason:</strong> ${reason}`) +
      p('If you believe this is a mistake or you\'d like to reapply with updated information, please contact us.', true),
    ),
  )
}

export async function sendNewInterest(to: string, founderName: string, investorName: string, startupName: string) {
  await send(
    to,
    `${investorName} is interested in ${startupName}`,
    emailShell(
      h1('New interest request') +
      p(`Hi ${founderName}, ${highlight(investorName)} has expressed interest in ${highlight(startupName)}.`) +
      p('Review their profile and decide whether to accept or decline. Accepting unlocks a private chat.', true),
      'Review request',
      `${APP_URL}/interests`,
    ),
  )
}

export async function sendInterestAccepted(to: string, investorName: string, startupName: string, matchId: string) {
  await send(
    to,
    `Your interest in ${startupName} was accepted`,
    emailShell(
      h1('You\'re connected') +
      p(`Great news — the founder of ${highlight(startupName)} has accepted your interest.`) +
      p('A private chat is now open. Reach out and start the conversation.', true),
      'Open chat',
      `${APP_URL}/chat/${matchId}`,
    ),
  )
}

export async function sendInterestDeclined(to: string, investorName: string, startupName: string) {
  await send(
    to,
    `Update on your interest in ${startupName}`,
    emailShell(
      h1('Interest not accepted') +
      p(`Hi ${investorName}, the founder of ${highlight(startupName)} has decided not to move forward at this time.`) +
      p('There are plenty of other great founders on Stage Zero — keep exploring.', true),
      'Browse startups',
      `${APP_URL}/browse`,
    ),
  )
}

export async function sendDealClosed(to: string, name: string, startupName: string) {
  await send(
    to,
    `Deal closed — ${startupName}`,
    emailShell(
      h1('Congratulations! 🎉') +
      p(`A deal has been closed between ${highlight(startupName)} and an investor.`) +
      p('This is what Stage Zero is built for. Wishing you both success.', true),
    ),
  )
}

export async function sendNewMessageNotification(to: string, recipientName: string, senderName: string, matchId: string) {
  await send(
    to,
    `New message from ${senderName}`,
    emailShell(
      h1('You have a new message') +
      p(`Hi ${recipientName}, ${highlight(senderName)} sent you a message on Stage Zero.`) +
      p('Log in to read and reply.', true),
      'Open chat',
      `${APP_URL}/chat/${matchId}`,
    ),
  )
}

// Admin notification emails
export async function sendAdminNewStartup(adminEmail: string, founderName: string, startupName: string) {
  await send(
    adminEmail,
    `[Admin] New startup pending review: ${startupName}`,
    emailShell(
      h1('New startup submission') +
      p(`${highlight(founderName)} submitted ${highlight(startupName)} for review.`),
      'Review in admin',
      `${APP_URL}/admin/founders`,
    ),
  )
}

export async function sendAdminNewInvestor(adminEmail: string, investorName: string, email: string) {
  await send(
    adminEmail,
    `[Admin] New investor pending verification: ${investorName}`,
    emailShell(
      h1('New investor application') +
      p(`${highlight(investorName)} (${email}) has submitted their investor profile for verification.`),
      'Review in admin',
      `${APP_URL}/admin/investors`,
    ),
  )
}
