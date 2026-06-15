'use client'

// Campaign-level branded deliverable downloads — the campaign PDF and brand style
// sheet. Reuses the shared DownloadLinkButton; per-creative spec sheets and social
// assets are offered from the lightbox.
import { DownloadLinkButton } from './download-link-button'

export function DeliverableDownloads({ campaignId }: { campaignId: string }) {
  const base = `/api/campaigns/${campaignId}/deliverables`
  return (
    <>
      <DownloadLinkButton
        href={`${base}/campaign-pdf`}
        label="Campaign PDF"
        toastMessage="Building the campaign PDF…"
      />
      <DownloadLinkButton
        href={`${base}/brand-sheet`}
        label="Brand sheet"
        toastMessage="Building the brand sheet…"
      />
    </>
  )
}
