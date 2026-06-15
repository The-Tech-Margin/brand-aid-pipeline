// One creative thumbnail in the browser grid. A button (keyboard-activatable) that
// opens the lightbox; roving tabindex is controlled by the parent grid.
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import type { CreativeItem } from '@/features/creatives/creatives'

const RATIO_CSS: Record<string, string> = { '1:1': '1 / 1', '9:16': '9 / 16', '16:9': '16 / 9' }

interface CreativeCardProps {
  item: CreativeItem
  tabIndex: number
  onActivate: () => void
}

export function CreativeCard({ item, tabIndex, onActivate }: CreativeCardProps) {
  return (
    <button
      type="button"
      data-creative
      tabIndex={tabIndex}
      onClick={onActivate}
      aria-label={`${item.productName} ${item.ratio}, ${item.source}${item.variant === 'edited' ? ', edited' : ''}. Open preview.`}
      className="bh-grid-cell border-border bg-muted/30 flex w-full flex-col overflow-hidden border text-left focus-visible:outline-none"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <div className="relative w-full" style={{ aspectRatio: RATIO_CSS[item.ratio] ?? '1 / 1' }}>
        {item.signedUrl ? (
          <Image
            src={item.signedUrl}
            alt={`${item.productName} ${item.ratio} creative`}
            fill
            sizes="(max-width: 640px) 50vw, 240px"
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
            No image
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 p-2">
        <span className="text-xs font-medium">{item.ratio}</span>
        <div className="flex items-center gap-1">
          {item.variant === 'edited' && <Badge tone="info">Edited</Badge>}
          <Badge tone={item.source === 'reused' ? 'info' : 'success'}>{item.source}</Badge>
        </div>
      </div>
    </button>
  )
}
