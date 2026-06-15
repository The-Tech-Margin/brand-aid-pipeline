'use client'

// Live run progress — polls the events endpoint until the run reaches a terminal
// state, appending new log events. On completion it refreshes the server page so
// the final creatives + compliance render. Polling (not a held connection) keeps it
// robust on serverless.
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RunEventsLog, type RunLogEvent } from './run-events-log'
import { Badge, StatusDot, toneForRun } from '@/components/ui/badge'
import { SpinnerIcon } from '@/components/icons'
import type { RunStatus } from '@/types/database'

interface RunProgressProps {
  runId: string
  initialStatus: RunStatus
  initialEvents: RunLogEvent[]
}

const isTerminal = (s: RunStatus) => s === 'succeeded' || s === 'failed'

export function RunProgress({ runId, initialStatus, initialEvents }: RunProgressProps) {
  const router = useRouter()
  const [status, setStatus] = useState<RunStatus>(initialStatus)
  const [events, setEvents] = useState<RunLogEvent[]>(initialEvents)
  const sinceRef = useRef<string | undefined>(initialEvents.at(-1)?.createdAt)

  useEffect(() => {
    if (isTerminal(status)) return
    let active = true

    async function tick() {
      try {
        const qs = sinceRef.current ? `?since=${encodeURIComponent(sinceRef.current)}` : ''
        const res = await fetch(`/api/runs/${runId}/events${qs}`)
        if (!res.ok || !active) return
        const data = (await res.json()) as { status: RunStatus; events: RunLogEvent[] }
        if (!active) return
        if (data.events?.length) {
          setEvents((prev) => [...prev, ...data.events])
          sinceRef.current = data.events.at(-1)!.createdAt
        }
        setStatus(data.status)
        if (isTerminal(data.status)) router.refresh()
      } catch {
        // transient; next tick retries
      }
    }

    const id = setInterval(tick, 1500)
    return () => {
      active = false
      clearInterval(id)
    }
  }, [runId, status, router])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {!isTerminal(status) && (
          <SpinnerIcon className="text-brand-cyan h-4 w-4" aria-hidden="true" />
        )}
        <Badge tone={toneForRun(status)}>
          <StatusDot tone={toneForRun(status)} />
          {status}
        </Badge>
        {!isTerminal(status) && (
          <span className="text-muted-foreground text-sm" aria-live="polite">
            Running…
          </span>
        )}
      </div>
      <RunEventsLog events={events} />
    </div>
  )
}
