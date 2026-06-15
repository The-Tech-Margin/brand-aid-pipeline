'use client'

// Campaign + latest-run list for the dashboard, wrapped in the shared GalleryView for
// search / sort / grid-or-list. Grid = the rich cards; list = a compact table.
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge, StatusDot, toneForRun } from '@/components/ui/badge'
import {
  GalleryView,
  type GalleryColumn,
  type GallerySortOption,
} from '@/components/ui/gallery-view'
import { formatDate, formatDateTime } from '@/lib/format'
import type { CampaignWithRuns } from '@/features/dashboard/dashboard'

interface RunHistoryProps {
  campaigns: CampaignWithRuns[]
}

const SORTS: GallerySortOption<CampaignWithRuns>[] = [
  { key: 'newest', label: 'Newest', compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  { key: 'owner', label: 'Owner', compare: (a, b) => a.ownerName.localeCompare(b.ownerName) },
]

const COLUMNS: GalleryColumn<CampaignWithRuns>[] = [
  {
    key: 'name',
    header: 'Campaign',
    width: 'minmax(0, 2fr)',
    cell: (c) => <span className="truncate font-medium">{c.name}</span>,
  },
  {
    key: 'owner',
    header: 'Owner',
    width: 'minmax(0, 1.2fr)',
    cell: (c) => <span className="text-muted-foreground truncate">{c.ownerName}</span>,
  },
  {
    key: 'status',
    header: 'Latest',
    width: 'minmax(0, 1fr)',
    cell: (c) => {
      const latest = c.runs[0]
      return latest ? (
        <Badge tone={toneForRun(latest.status)}>
          <StatusDot tone={toneForRun(latest.status)} />
          {latest.status}
        </Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    key: 'region',
    header: 'Region',
    width: 'minmax(0, 1fr)',
    cell: (c) => <span className="text-muted-foreground truncate">{c.region}</span>,
  },
  {
    key: 'creatives',
    header: 'Creatives',
    width: 'minmax(0, 0.8fr)',
    align: 'end',
    cell: (c) => (
      <span className="text-muted-foreground tabular-nums">{c.runs[0]?.totals.creatives ?? 0}</span>
    ),
  },
  {
    key: 'created',
    header: 'Created',
    width: 'minmax(0, 1fr)',
    align: 'end',
    cell: (c) => (
      <span className="text-muted-foreground text-xs tabular-nums">{formatDate(c.createdAt)}</span>
    ),
  },
]

export function RunHistory({ campaigns }: RunHistoryProps) {
  const router = useRouter()

  function renderCard(c: CampaignWithRuns) {
    const latest = c.runs[0]
    return (
      <li
        key={c.campaignId}
        className="border-border bg-card flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium">{c.name}</h3>
            {latest && (
              <Badge tone={toneForRun(latest.status)}>
                <StatusDot tone={toneForRun(latest.status)} />
                {latest.status}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            {c.ownerName} · {c.region} · {formatDateTime(c.createdAt)}
            {latest ? ` · ${latest.totals.creatives ?? 0} creatives` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {latest && (
            <Link
              href={`/runs/${latest.runId}`}
              className="border-border hover:bg-muted border px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{ borderRadius: 'var(--radius)' }}
            >
              View report
            </Link>
          )}
          <Link
            href={`/campaigns/${c.campaignId}/creatives`}
            className="border-border hover:bg-muted border px-3 py-1.5 text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderRadius: 'var(--radius)' }}
          >
            Browse creatives
          </Link>
        </div>
      </li>
    )
  }

  return (
    <GalleryView
      label="campaigns"
      items={campaigns}
      getKey={(c) => c.campaignId}
      getSearchText={(c) => `${c.name} ${c.ownerName} ${c.region}`}
      getRowLabel={(c) => `Open ${c.name}`}
      onActivate={(c) =>
        router.push(c.runs[0] ? `/runs/${c.runs[0].runId}` : `/campaigns/${c.campaignId}/creatives`)
      }
      sorts={SORTS}
      columns={COLUMNS}
      searchPlaceholder="Search campaigns…"
      emptyMessage="No campaigns match your search."
      renderGrid={(items) => <ul className="flex flex-col gap-3">{items.map(renderCard)}</ul>}
    />
  )
}
