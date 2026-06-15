'use client'

// Entry-point button that opens the in-app brand editor for a creative (or a blank
// canvas for a new design). Self-contained: owns the dialog open state.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SparklesIcon } from '@/components/icons'
import { EditorDialog } from './editor-dialog'
import type { CampaignBrandKit, EditorTarget } from './editor-types'

interface OpenEditorButtonProps {
  target: EditorTarget
  brandKit: CampaignBrandKit
  label?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'default' | 'lg'
}

export function OpenEditorButton({
  target,
  brandKit,
  label = 'Edit',
  variant = 'outline',
  size = 'sm',
}: OpenEditorButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)}>
        <SparklesIcon className="h-4 w-4" aria-hidden="true" />
        {label}
      </Button>
      <EditorDialog
        open={open}
        target={open ? target : null}
        brandKit={brandKit}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
