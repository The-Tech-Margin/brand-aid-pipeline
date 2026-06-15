// Structured run log — monospace, level-colored, scrollable. Presentational.
import { timeOnly } from '@/lib/format'

export interface RunLogEvent {
  id: string
  level: string
  stage: string
  message: string
  createdAt: string
}

const LEVEL_CLASS: Record<string, string> = {
  error: 'text-brand-hot-red',
  warn: 'text-brand-goldenrod',
  info: 'text-muted-foreground',
  debug: 'text-muted-foreground',
}

export function RunEventsLog({ events }: { events: RunLogEvent[] }) {
  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm">Waiting for the first event…</p>
  }
  return (
    <ol
      className="border-border bg-muted/30 max-h-96 overflow-auto border p-3 font-mono text-xs"
      style={{ borderRadius: 'var(--radius)' }}
    >
      {events.map((e) => (
        <li key={e.id} className="flex gap-3 py-0.5">
          <span className="text-muted-foreground shrink-0">{timeOnly(e.createdAt)}</span>
          <span className={`shrink-0 uppercase ${LEVEL_CLASS[e.level] ?? ''}`}>{e.level}</span>
          <span className="text-muted-foreground shrink-0">{e.stage}</span>
          <span className="break-words">{e.message}</span>
        </li>
      ))}
    </ol>
  )
}
