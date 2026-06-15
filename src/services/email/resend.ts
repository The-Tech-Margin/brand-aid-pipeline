import 'server-only'

// Transactional email via Resend. Both senders GRACEFULLY no-op (log only) when
// RESEND_API_KEY is unset, and every send is wrapped in try/catch — so a missing key or a
// Resend outage never breaks a user-facing submission. The client is lazy-imported so the
// dependency isn't pulled into bundles that never send mail.
import { env } from '@/config/env'

export interface AccessRequestEmailData {
  name: string
  organization: string
  email: string
}

async function getResend() {
  const apiKey = env.resendApiKey()
  if (!apiKey) return null
  const { Resend } = await import('resend')
  return new Resend(apiKey)
}

/** Notify the admin that a new access request arrived. */
export async function sendAccessRequestNotification(data: AccessRequestEmailData): Promise<void> {
  try {
    const resend = await getResend()
    if (!resend) {
      console.info('[email] RESEND_API_KEY unset — skipping access-request notification')
      return
    }
    await resend.emails.send({
      from: env.resendFrom(),
      to: env.requestNotifyEmail(),
      subject: `New access request: ${data.name} (${data.organization})`,
      text: [
        'A new visitor access request was submitted.',
        '',
        `Name:         ${data.name}`,
        `Organization: ${data.organization}`,
        `Email:        ${data.email}`,
        '',
        'Review it in the admin area → Requests.',
      ].join('\n'),
    })
  } catch (err) {
    console.error('[email] access-request notification failed:', err)
  }
}

/** Acknowledge the requester. Leak-free: never states whether they already have access. */
export async function sendAccessRequestConfirmation(data: {
  name: string
  email: string
}): Promise<void> {
  try {
    const resend = await getResend()
    if (!resend) {
      console.info('[email] RESEND_API_KEY unset — skipping access-request confirmation')
      return
    }
    await resend.emails.send({
      from: env.resendFrom(),
      to: data.email,
      subject: 'We received your Brand Helper access request',
      text: [
        `Hi ${data.name},`,
        '',
        "Thanks for requesting access to Brand Helper. We've received your request and an",
        "admin will review it. If approved, you'll get a sign-in link by email.",
      ].join('\n'),
    })
  } catch (err) {
    console.error('[email] access-request confirmation failed:', err)
  }
}
