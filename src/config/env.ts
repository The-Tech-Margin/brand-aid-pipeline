// Server-only environment accessors. Lazy getters so importing never throws at
// build time — a missing secret only errors when a route actually needs it.
import 'server-only'

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const env = {
  supabaseUrl: () => required('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: () => required('SUPABASE_SERVICE_ROLE_KEY'),
  supabaseSchema: () => process.env.SUPABASE_DB_SCHEMA ?? 'brand_helper',
  storageBucket: () => process.env.SUPABASE_STORAGE_BUCKET ?? 'brand-helper',
  // Vercel AI Gateway — single key routes OpenAI / Google / Black Forest Labs (FLUX)
  // image models for hero generation and in-editor edits. Read by the AI SDK; the
  // getter asserts presence so a generation/edit fails fast with a clear message.
  aiGatewayApiKey: () => required('AI_GATEWAY_API_KEY'),
  soundEnabled: () => process.env.SOUND_ENABLED === 'true',
  // Resend transactional email (access-request notifications). Optional: when the key is
  // unset the email layer no-ops, so dev/preview/CI run without it. RESEND_FROM is a
  // verified sender ("Brand Helper <noreply@…>"); notifications route to REQUEST_NOTIFY_EMAIL.
  resendApiKey: () => process.env.RESEND_API_KEY,
  resendFrom: () => process.env.RESEND_FROM ?? 'Brand Helper <onboarding@resend.dev>',
  requestNotifyEmail: () => process.env.REQUEST_NOTIFY_EMAIL ?? 'sonia@thetechmargin.com',
  // Admin assignment lives in the DB, not here: brand_helper.admin_allowlist is the
  // source of truth and a trigger stamps members.role from it (migration 0006).
} as const

/** Public values safe to reference on the client. */
export const publicEnv = {
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'Brand Helper',
}
