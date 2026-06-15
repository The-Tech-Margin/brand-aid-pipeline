'use client'

// Structured brief form, rendered dynamically from the field registry: it maps
// over BRIEF_FIELDS and renders each via its registered widget, so adding a brief
// field is a one-place registry change. Owns its field state; validates with the
// shared schema on submit and hands a typed Brief up to the run trigger.
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { BriefErrors } from './brief-errors'
import { DynamicField } from './field-widgets'
import { BRIEF_FIELDS, type FieldDef } from '@/features/brief/field-registry'
import { briefFromForm, emptyBriefForm, type BriefFormState } from '@/features/brief/from-form'
import type { Brief } from '@/features/brief/schema'

interface BriefFormProps {
  onValidBrief: (brief: Brief) => void
  pending: boolean
  initial?: BriefFormState
}

// Pair consecutive half-width fields so they render in a two-column row.
function toRows(fields: FieldDef[]): FieldDef[][] {
  const rows: FieldDef[][] = []
  for (const def of fields) {
    const last = rows[rows.length - 1]
    if (def.width === 'half' && last && last.length === 1 && last[0]!.width === 'half') {
      last.push(def)
    } else {
      rows.push([def])
    }
  }
  return rows
}

export function BriefForm({ onValidBrief, pending, initial }: BriefFormProps) {
  const [state, setState] = useState<BriefFormState>(initial ?? emptyBriefForm())
  const [errors, setErrors] = useState<string[]>([])
  const errorsRef = useRef<HTMLDivElement>(null)

  // Move focus to the error summary on a failed submit so it's announced and reachable.
  useEffect(() => {
    if (errors.length) errorsRef.current?.focus()
  }, [errors])

  const update = (key: keyof BriefFormState, value: BriefFormState[keyof BriefFormState]) =>
    setState((s) => ({ ...s, [key]: value }) as BriefFormState)

  function submit(e: FormEvent) {
    e.preventDefault()
    const result = briefFromForm(state)
    if (!result.ok || !result.brief) {
      setErrors(result.errors ?? ['Invalid brief'])
      return
    }
    setErrors([])
    onValidBrief(result.brief)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5" noValidate>
      {toRows(BRIEF_FIELDS).map((group) =>
        group.length > 1 ? (
          <div key={group[0]!.key} className="grid gap-5 sm:grid-cols-2">
            {group.map((def) => (
              <DynamicField key={def.key} def={def} state={state} update={update} />
            ))}
          </div>
        ) : (
          <DynamicField key={group[0]!.key} def={group[0]!} state={state} update={update} />
        ),
      )}

      <BriefErrors errors={errors} ref={errorsRef} />

      <Button type="submit" disabled={pending}>
        {pending ? 'Starting run…' : 'Generate creatives'}
      </Button>
    </form>
  )
}
