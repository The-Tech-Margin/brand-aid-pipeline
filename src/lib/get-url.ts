// Resolves the app's public base URL for redirect targets (e.g. the
// `emailRedirectTo` in Supabase magic-link / invite emails) so links always point at
// THIS app. Every origin is env-driven — no host is hardcoded — so a fork carries
// none of the original deployment's URLs.
//
// Why NEXT_PUBLIC_SITE_URL matters: Supabase only honors a magic link's `redirect_to`
// when it's on the project's Redirect URLs allowlist; otherwise it drops it and the
// user lands on whichever app owns the project's Site URL. Per-deploy Vercel preview
// hostnames change every deploy and can never be allowlisted, so set
// NEXT_PUBLIC_SITE_URL to your stable production origin (and add it to Supabase's
// allowlist). Extra origins the app also answers to — a vanity domain, a stable
// *.vercel.app alias — go in NEXT_PUBLIC_APP_ORIGINS as a comma-separated list.

function withProtocol(value: string): string {
  if (value.startsWith('http')) return value
  return `${value.startsWith('localhost') ? 'http' : 'https'}://${value}`
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

/** Extra origins this app answers to, beyond the site URL, the Vercel deploy URL, and
 *  localhost. Comma-separated in NEXT_PUBLIC_APP_ORIGINS. */
function configuredOrigins(): string[] {
  return (process.env.NEXT_PUBLIC_APP_ORIGINS ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => stripTrailingSlash(withProtocol(part)))
}

/** Always returns an absolute URL with a trailing slash. Prefer the configured site
 *  URL; fall back to the per-deploy Vercel URL, then localhost. Production should set
 *  NEXT_PUBLIC_SITE_URL so auth redirects land on a stable, allowlisted origin. */
export function getURL(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    'http://localhost:3000'
  url = withProtocol(url)
  return url.endsWith('/') ? url : `${url}/`
}

/** True if `origin` is one of this app's own origins (site URL, Vercel deploy URL,
 *  any NEXT_PUBLIC_APP_ORIGINS entry, or localhost). */
export function isAppOrigin(origin: string): boolean {
  const target = stripTrailingSlash(origin)
  if (target.startsWith('http://localhost')) return true
  const known = [process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_VERCEL_URL]
    .filter((value): value is string => Boolean(value))
    .map((value) => stripTrailingSlash(withProtocol(value)))
  if (known.includes(target)) return true
  return configuredOrigins().includes(target)
}
