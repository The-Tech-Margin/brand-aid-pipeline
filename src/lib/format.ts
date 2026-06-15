// Deterministic UTC formatters — same output on server and client, so they never
// cause hydration mismatches (locale-aware formatting would).
const pad = (n: number) => String(n).padStart(2, '0')

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
}

/** Compact UTC datetime for dense tables: "Jun 15, 14:45" (no year/seconds/UTC
 *  suffix). Pair with formatDateTime() in a title= for the full timestamp on hover. */
export function formatShortDateTime(iso: string): string {
  const d = new Date(iso)
  return `${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCDate()}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

export function timeOnly(iso: string): string {
  const d = new Date(iso)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

/** Human file size from a byte count. Deterministic (no locale). */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let u = 0
  while (n >= 1024 && u < units.length - 1) {
    n /= 1024
    u++
  }
  return `${u === 0 ? Math.round(n) : n.toFixed(1)} ${units[u]}`
}

export function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '—'
  const s = ms / 1000
  return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`
}
