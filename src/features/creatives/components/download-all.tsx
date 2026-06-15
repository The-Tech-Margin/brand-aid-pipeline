'use client'

// "Download all (ZIP)" — navigates to the streaming export route, which returns a
// ZIP mirroring the product/ratio folder structure plus a deliverables/ folder.
import { DownloadLinkButton } from './download-link-button'

export function DownloadAll({ campaignId }: { campaignId: string }) {
  return (
    <DownloadLinkButton
      href={`/api/campaigns/${campaignId}/export`}
      label="Download all (ZIP)"
      toastMessage="Preparing your ZIP…"
    />
  )
}
