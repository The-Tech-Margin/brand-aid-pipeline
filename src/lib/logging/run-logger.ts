// Structured run logger — accumulates RunEvents for the report and forwards each
// to an optional sink (e.g. live persistence). Pure in-memory; no I/O of its own.
import type { RunEvent } from '@/features/pipeline/types'
import type { EventLevel } from '@/types/database'

export class RunLogger {
  private events: RunEvent[] = []

  constructor(private readonly sink?: (event: RunEvent) => void) {}

  private emit(level: EventLevel, stage: string, message: string, meta?: Record<string, unknown>) {
    const event: RunEvent = { level, stage, message, meta, at: Date.now() }
    this.events.push(event)
    this.sink?.(event)
  }

  info(stage: string, message: string, meta?: Record<string, unknown>) {
    this.emit('info', stage, message, meta)
  }
  warn(stage: string, message: string, meta?: Record<string, unknown>) {
    this.emit('warn', stage, message, meta)
  }
  error(stage: string, message: string, meta?: Record<string, unknown>) {
    this.emit('error', stage, message, meta)
  }

  list(): RunEvent[] {
    return this.events
  }
}
