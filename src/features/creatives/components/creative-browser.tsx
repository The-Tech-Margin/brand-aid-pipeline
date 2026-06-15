'use client'

// Creative browser — tabs by product, each panel a shared GalleryView (search + sort +
// grid/list toggle). Grid mode keeps the ratio-grouped, keyboard-navigable card grid;
// list mode is the shared studio table. Both open a focus-trapped lightbox.
import { useMemo, useState, type ReactNode } from 'react'
import Image from 'next/image'
import { Tabs } from '@/components/ui/tabs'
import {
  GalleryView,
  type GalleryColumn,
  type GallerySortOption,
} from '@/components/ui/gallery-view'
import { CreativeGrid } from './creative-grid'
import { CreativeLightbox } from './creative-lightbox'
import { DownloadAll } from './download-all'
import { DeliverableDownloads } from './deliverable-downloads'
import { OpenEditorButton } from '@/features/editor'
import { ASPECT_RATIOS } from '@/features/brief/schema'
import { formatDate } from '@/lib/format'
import type { CampaignCreatives, CreativeItem } from '@/features/creatives/creatives'

interface CreativeBrowserProps {
  campaignId: string
  data: CampaignCreatives
}

const ratioIndex = (r: CreativeItem['ratio']) => ASPECT_RATIOS.indexOf(r)

const CREATIVE_SORTS: GallerySortOption<CreativeItem>[] = [
  {
    key: 'ratio',
    label: 'Aspect ratio',
    compare: (a, b) => ratioIndex(a.ratio) - ratioIndex(b.ratio),
  },
  {
    key: 'newest',
    label: 'Newest',
    compare: (a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
  },
  { key: 'type', label: 'Source', compare: (a, b) => a.source.localeCompare(b.source) },
]

export function CreativeBrowser({ campaignId, data }: CreativeBrowserProps) {
  const [active, setActive] = useState(data.products[0]?.productSlug ?? '')
  const [lightbox, setLightbox] = useState<CreativeItem | null>(null)

  const columns = useMemo<GalleryColumn<CreativeItem>[]>(
    () => [
      {
        key: 'thumb',
        header: 'Image',
        width: '40px',
        cell: (item) => (
          <span
            className="bg-muted relative block h-10 w-10 shrink-0 overflow-hidden"
            style={{ borderRadius: '2px' }}
          >
            {item.signedUrl && (
              <Image src={item.signedUrl} alt="" fill sizes="40px" className="object-cover" />
            )}
          </span>
        ),
      },
      {
        key: 'ratio',
        header: 'Ratio',
        width: 'minmax(0, 1.4fr)',
        cell: (item) => (
          <span className="flex min-w-0 flex-col">
            <span>{item.ratio}</span>
            {item.width && item.height && (
              <span className="text-muted-foreground text-xs tabular-nums">
                {item.width}×{item.height}
              </span>
            )}
          </span>
        ),
      },
      {
        key: 'source',
        header: 'Source',
        width: 'minmax(0, 1fr)',
        cell: (item) => (
          <span
            className="border-border text-muted-foreground border px-1.5 py-0.5 text-[10px] uppercase"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {item.source}
          </span>
        ),
      },
      {
        key: 'variant',
        header: 'Variant',
        width: 'minmax(0, 1fr)',
        cell: (item) => (
          <span className="text-muted-foreground truncate">{item.variant ?? '—'}</span>
        ),
      },
      {
        key: 'date',
        header: 'Date',
        width: 'minmax(0, 1fr)',
        align: 'end',
        cell: (item) => (
          <span className="text-muted-foreground text-xs tabular-nums">
            {item.createdAt ? formatDate(item.createdAt) : '—'}
          </span>
        ),
      },
    ],
    [],
  )

  const renderGrid = (items: CreativeItem[]): ReactNode => {
    const groups = ASPECT_RATIOS.filter((r) => items.some((i) => i.ratio === r)).map((r) => ({
      ratio: r,
      items: items.filter((i) => i.ratio === r),
    }))
    return (
      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <section key={g.ratio} className="flex flex-col gap-2">
            <h3 className="text-muted-foreground text-sm font-medium">{g.ratio}</h3>
            <CreativeGrid items={g.items} onOpen={setLightbox} />
          </section>
        ))}
      </div>
    )
  }

  const panels = useMemo<Record<string, ReactNode>>(
    () =>
      Object.fromEntries(
        data.products.map((p) => {
          const items = p.ratios.flatMap((r) => r.items)
          return [
            p.productSlug,
            <GalleryView
              key={p.productSlug}
              label={`${p.productName} creatives`}
              items={items}
              getKey={(item) => item.assetId}
              getSearchText={(item) =>
                `${item.productName} ${item.ratio} ${item.source} ${item.variant ?? ''}`
              }
              getRowLabel={(item) =>
                `Open ${item.productName} ${item.ratio} ${item.source} creative`
              }
              onActivate={(item) => setLightbox(item)}
              sorts={CREATIVE_SORTS}
              columns={columns}
              renderGrid={renderGrid}
              searchPlaceholder="Search creatives…"
              emptyMessage="No creatives match your search."
            />,
          ]
        }),
      ),
    [data, columns],
  )

  if (data.products.length === 0) {
    return <p className="text-muted-foreground">No creatives yet for this campaign.</p>
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap justify-end gap-2">
        <OpenEditorButton
          target={{
            assetId: null,
            campaignId,
            ratio: '1:1',
            imageUrl: null,
            name: 'New design',
          }}
          brandKit={data.brandKit}
          label="New design"
        />
        <DeliverableDownloads campaignId={campaignId} />
        <DownloadAll campaignId={campaignId} />
      </div>
      <Tabs
        label="Products"
        value={active}
        onValueChange={setActive}
        items={data.products.map((p) => ({ value: p.productSlug, label: p.productName }))}
        panels={panels}
      />
      <CreativeLightbox
        item={lightbox}
        campaignId={campaignId}
        brandKit={data.brandKit}
        onClose={() => setLightbox(null)}
      />
    </div>
  )
}
