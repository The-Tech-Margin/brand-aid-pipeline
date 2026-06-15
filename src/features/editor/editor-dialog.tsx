'use client'

// Hosts the Konva editor in the app's focus-trapped Dialog. The canvas is loaded
// with ssr:false because react-konva touches window/canvas and must not render on
// the server.
import dynamic from 'next/dynamic'
import { Dialog } from '@/components/ui/dialog'
import type { CampaignBrandKit, EditorTarget } from './editor-types'

const BrandEditor = dynamic(() => import('./brand-editor').then((m) => m.BrandEditor), {
  ssr: false,
  loading: () => <p className="text-muted-foreground text-sm">Loading editor…</p>,
})

interface EditorDialogProps {
  open: boolean
  target: EditorTarget | null
  brandKit: CampaignBrandKit
  onClose: () => void
}

export function EditorDialog({ open, target, brandKit, onClose }: EditorDialogProps) {
  return (
    <Dialog
      open={open && !!target}
      onClose={onClose}
      title={target ? `Edit · ${target.name}` : 'Editor'}
    >
      {target && <BrandEditor target={target} brandKit={brandKit} onClose={onClose} />}
    </Dialog>
  )
}
