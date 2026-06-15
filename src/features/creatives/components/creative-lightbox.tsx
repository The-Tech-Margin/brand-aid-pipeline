'use client'

// Full-size creative preview in a focus-trapped dialog, with the in-app editor and
// per-creative branded deliverable downloads.
import Image from 'next/image'
import { Dialog } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { OpenEditorButton } from '@/features/editor'
import { DownloadLinkButton } from './download-link-button'
import type { CampaignBrandKit, CreativeItem } from '@/features/creatives/creatives'

interface CreativeLightboxProps {
  item: CreativeItem | null
  campaignId: string
  brandKit: CampaignBrandKit
  onClose: () => void
}

export function CreativeLightbox({ item, campaignId, brandKit, onClose }: CreativeLightboxProps) {
  return (
    <Dialog
      open={!!item}
      onClose={onClose}
      title={item ? `${item.productName} · ${item.ratio}` : ''}
    >
      {item && (
        <div className="flex flex-col gap-3">
          <div
            className="bg-muted/30 relative mx-auto max-h-[70vh] w-full"
            style={{ aspectRatio: item.ratio.replace(':', '/') }}
          >
            {item.signedUrl && (
              <Image
                src={item.signedUrl}
                alt={`${item.productName} ${item.ratio} creative`}
                fill
                sizes="100vw"
                className="object-contain"
              />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={item.source === 'reused' ? 'info' : 'success'}>{item.source}</Badge>
            {item.variant === 'edited' && <Badge tone="info">Edited</Badge>}
            <span className="text-muted-foreground text-sm">
              {item.width}×{item.height}
            </span>
            {item.signedUrl && (
              <a
                href={item.signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-cyan ml-auto text-sm hover:underline"
              >
                Open full size
              </a>
            )}
          </div>
          {item.signedUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <OpenEditorButton
                target={{
                  assetId: item.assetId,
                  campaignId,
                  ratio: item.ratio,
                  imageUrl: item.signedUrl,
                  name: `${item.productName} ${item.ratio}`,
                }}
                brandKit={brandKit}
                label="Edit in editor"
              />
              <DownloadLinkButton
                href={`/api/campaigns/${campaignId}/deliverables/creatives/${item.assetId}/spec-sheet`}
                label="Spec sheet"
                toastMessage="Building the spec sheet…"
              />
              <DownloadLinkButton
                href={`/api/campaigns/${campaignId}/deliverables/creatives/${item.assetId}/social/instagram-square`}
                label="Social (IG)"
                toastMessage="Building the social asset…"
              />
            </div>
          )}
        </div>
      )}
    </Dialog>
  )
}
