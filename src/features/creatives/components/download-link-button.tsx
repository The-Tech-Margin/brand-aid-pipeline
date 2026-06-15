'use client'

// Shared "navigate to a streaming download route" button — one primitive reused by
// the ZIP export and every branded-deliverable download, so the pending/toast UX
// lives in one place.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/feedback/toast'
import { DownloadIcon, SpinnerIcon } from '@/components/icons'

interface DownloadLinkButtonProps {
  href: string
  label: string
  /** Optional "preparing…" toast shown while the download is generated server-side. */
  toastMessage?: string
}

export function DownloadLinkButton({ href, label, toastMessage }: DownloadLinkButtonProps) {
  const [pending, setPending] = useState(false)
  const toast = useToast()

  function download() {
    setPending(true)
    if (toastMessage) toast.info(toastMessage, { description: 'The download will start shortly.' })
    window.location.href = href
    setTimeout(() => setPending(false), 2500)
  }

  return (
    <Button variant="outline" size="sm" onClick={download} disabled={pending}>
      {pending ? (
        <SpinnerIcon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <DownloadIcon className="h-4 w-4" aria-hidden="true" />
      )}
      {label}
    </Button>
  )
}
