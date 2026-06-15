'use client'

// Paste-or-upload brief entry. Reads an uploaded .json/.yaml file into the
// textarea, then parses + validates on submit via the shared parser.
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BriefErrors } from './brief-errors'
import { parseBrief } from '@/features/brief/parse'
import type { Brief } from '@/features/brief/schema'

interface BriefPasteProps {
  onValidBrief: (brief: Brief) => void
  pending: boolean
}

const PLACEHOLDER = `{
  "campaign_name": "Summer Glow 2026",
  "products": [ ... ],
  "target_region": "Japan",
  "target_audience": "Urban women, 25-40",
  "campaign_message": "Glow that lasts all day",
  "locale": "ja-JP"
}`

export function BriefPaste({ onValidBrief, pending }: BriefPasteProps) {
  const [text, setText] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const errorsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (errors.length) errorsRef.current?.focus()
  }, [errors])

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset so re-selecting the same file fires onChange again.
    e.target.value = ''
    if (!file) return
    const isBriefFile = /\.(json|ya?ml)$/i.test(file.name) && !file.type.startsWith('image/')
    if (!isBriefFile) {
      setText('')
      setErrors([
        `“${file.name}” isn’t a brief file. Upload a .json or .yaml brief here. To use your own image, switch to the Form tab and add it under a product’s Input assets.`,
      ])
      return
    }
    const content = await file.text()
    // Binary masquerading as text (e.g. an image renamed .json) contains NUL bytes.
    if (/[\x00-\x08\x0e-\x1f]/.test(content)) {
      setText('')
      setErrors(['That file isn’t valid UTF-8 text — upload a .json or .yaml brief.'])
      return
    }
    setErrors([])
    setText(content)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    const result = parseBrief(text)
    if (!result.ok || !result.brief) {
      setErrors(result.errors ?? ['Invalid brief'])
      return
    }
    setErrors([])
    onValidBrief(result.brief)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label htmlFor="brief-text" className="text-sm font-medium">
          Brief (JSON or YAML)
        </label>
        <span className="flex items-center gap-2 text-sm">
          <label htmlFor="brief-file" className="text-muted-foreground">
            or upload a file:
          </label>
          <input
            id="brief-file"
            type="file"
            accept=".json,.yaml,.yml"
            onChange={onFile}
            className="text-muted-foreground file:border-border file:bg-card text-sm file:mr-3 file:border file:px-3 file:py-1.5 file:text-sm"
          />
        </span>
      </div>
      <Textarea
        id="brief-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        placeholder={PLACEHOLDER}
      />
      <BriefErrors errors={errors} ref={errorsRef} />
      <Button type="submit" disabled={pending || !text.trim()}>
        {pending ? 'Starting run…' : 'Generate creatives'}
      </Button>
    </form>
  )
}
