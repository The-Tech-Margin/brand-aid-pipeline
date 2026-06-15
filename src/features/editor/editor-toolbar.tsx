'use client'

// Editor toolbar — compact, grouped, verb-labelled controls for the canvas: Add (text +
// logo) · AI (generate / remove bg) · Selected element (color + delete) · Save. Generate
// works on a blank new design (text-to-image); Remove bg needs a saved creative.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageIcon, PlusIcon, SparklesIcon, SpinnerIcon, TrashIcon } from '@/components/icons'

export interface EditorToolbarProps {
  palette: string[]
  busy: boolean
  hasSelection: boolean
  /** Generation (text-to-image / generative edit) is offered. */
  canGenerate: boolean
  /** Pixel ops on the existing image (remove bg) — needs a saved creative + a background. */
  canEditImage: boolean
  onAddText: (text: string) => void
  onAddLogo: () => void
  onSetFill: (color: string) => void
  onDeleteSelected: () => void
  onRemoveBg: () => void
  onGenerative: () => void
  onSave: () => void
}

function Divider() {
  return <span className="bg-border hidden h-6 w-px sm:block" aria-hidden="true" />
}

export function EditorToolbar(props: EditorToolbarProps) {
  const [text, setText] = useState('')

  function submitText() {
    if (!text.trim()) return
    props.onAddText(text.trim())
    setText('')
  }

  return (
    <div role="group" aria-label="Design tools" className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Add elements">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              submitText()
            }
          }}
          placeholder="Add headline…"
          aria-label="Headline text to add"
          className="h-9 w-full min-w-0 sm:w-40"
        />
        <Button
          variant="outline"
          size="sm"
          disabled={!text.trim()}
          onClick={submitText}
          title="Add text"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          Text
        </Button>
        <Button variant="outline" size="sm" onClick={props.onAddLogo} title="Add your logo">
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          Logo
        </Button>
      </div>

      <Divider />

      <div className="flex items-center gap-1.5" role="group" aria-label="AI">
        <Button
          variant="outline"
          size="sm"
          disabled={props.busy || !props.canGenerate}
          onClick={props.onGenerative}
          title="Generate or change the image with AI"
        >
          {props.busy ? (
            <SpinnerIcon className="h-4 w-4" aria-hidden="true" />
          ) : (
            <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          )}
          Generate
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={props.busy || !props.canEditImage}
          onClick={props.onRemoveBg}
          title="Remove the background with AI (needs a saved creative)"
        >
          <SparklesIcon className="h-4 w-4" aria-hidden="true" />
          Remove bg
        </Button>
      </div>

      <Divider />

      <div className="flex items-center gap-1.5" role="group" aria-label="Selected element">
        {props.palette.length > 0 && (
          <div className="flex items-center gap-1" role="group" aria-label="Text color">
            {props.palette.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Set text color ${color}`}
                title={`Set text color ${color}`}
                disabled={!props.hasSelection}
                onClick={() => props.onSetFill(color)}
                className="border-border h-6 w-6 rounded-[var(--radius)] border focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-40"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={!props.hasSelection}
          onClick={props.onDeleteSelected}
          title="Delete selected"
        >
          <TrashIcon className="h-4 w-4" aria-hidden="true" />
          Delete
        </Button>
      </div>

      <Button
        variant="primary"
        size="sm"
        disabled={props.busy}
        onClick={props.onSave}
        className="ml-auto"
      >
        Save
      </Button>
    </div>
  )
}
