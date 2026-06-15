'use client'

// Brief intake container — switches between the structured form and paste/upload,
// lets the user pick a run mode, then POSTs the validated brief to /api/runs and
// navigates to the live run report.
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs } from '@/components/ui/tabs'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/feedback/toast'
import { briefToFormState } from '@/features/brief/from-form'
import { BriefForm } from './brief-form'
import { BriefPaste } from './brief-paste'
import type { Brief } from '@/features/brief/schema'

type RunModeChoice = 'auto' | 'inline' | 'chunked'

interface BriefIntakeProps {
  /** Prefill the structured form (e.g. when arriving from a help-guide example). */
  initialBrief?: Brief
}

export function BriefIntake({ initialBrief }: BriefIntakeProps) {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState('form')
  const [runMode, setRunMode] = useState<RunModeChoice>('auto')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function fail(message: string) {
    setSubmitError(message)
    toast.error('Could not start run', { description: message })
  }

  function trigger(brief: Brief) {
    setSubmitError(null)
    startTransition(async () => {
      try {
        const res = await fetch('/api/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief, mode: runMode === 'auto' ? undefined : runMode }),
        })
        const data = await res.json()
        if (!res.ok) {
          const details = Array.isArray(data?.details) ? `: ${data.details.join('; ')}` : ''
          fail(`${data?.error ?? 'Failed to start run'}${details}`)
          return
        }
        router.push(`/runs/${data.runId}`)
      } catch (err) {
        fail(err instanceof Error ? err.message : 'Failed to start run')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 sm:max-w-xs">
        <label htmlFor="run-mode" className="text-sm font-medium">
          Run mode
        </label>
        <Select
          id="run-mode"
          value={runMode}
          onChange={(e) => setRunMode(e.target.value as RunModeChoice)}
        >
          <option value="auto">Auto (recommended)</option>
          <option value="inline">Fast — single pass</option>
          <option value="chunked">Reliable — one product per step</option>
        </Select>
      </div>

      {submitError && (
        <p role="alert" className="text-brand-hot-red text-sm">
          {submitError}
        </p>
      )}

      <Tabs
        label="Brief input mode"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: 'form', label: 'Form' },
          { value: 'paste', label: 'Paste / Upload' },
        ]}
        panels={{
          form: (
            <BriefForm
              onValidBrief={trigger}
              pending={pending}
              initial={initialBrief ? briefToFormState(initialBrief) : undefined}
            />
          ),
          paste: <BriefPaste onValidBrief={trigger} pending={pending} />,
        }}
      />
    </div>
  )
}
