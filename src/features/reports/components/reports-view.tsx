'use client'

// Reports + data management. Lists every campaign and its runs with the brand-
// compliance pass rate and legal flag counts, links to the full run report and the
// creative outputs (by product → aspect ratio), and offers destructive management:
// delete a run (keeps the campaign) or a whole campaign (cascades + clears storage).
// Deletes use a two-step inline confirm so they're never a single mis-click. The list
// is wrapped in the shared GalleryView for search / sort / grid-or-list.
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge, StatusDot, toneForRun, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GalleryView,
  type GalleryColumn,
  type GallerySortOption,
} from '@/components/ui/gallery-view'
import { useToast } from '@/components/feedback/toast'
import { formatDate, formatDateTime, formatShortDateTime } from '@/lib/format'
import { ChevronRightIcon, ImageIcon, TrashIcon } from '@/components/icons'
import { deleteCampaignAction, deleteRunAction } from '@/features/reports/actions'
import type { CampaignReport, ReportRun } from '@/features/reports/data'

function complianceTone(pct: number): BadgeTone {
  if (pct >= 90) return 'success'
  if (pct >= 70) return 'warn'
  return 'danger'
}

function legalTone(legal: ReportRun['legal']): BadgeTone {
  if (legal.fail > 0) return 'danger'
  if (legal.warn > 0) return 'warn'
  return 'success'
}

function statusBadge(r: ReportRun) {
  return (
    <Badge tone={toneForRun(r.status)}>
      <StatusDot tone={toneForRun(r.status)} />
      {r.status}
    </Badge>
  )
}

function complianceBadge(r: ReportRun) {
  const pct = r.totals.compliancePassRate ?? 0
  return <Badge tone={complianceTone(pct)}>{pct}% pass</Badge>
}

function legalBadge(r: ReportRun) {
  return (
    <Badge tone={legalTone(r.legal)}>
      {r.legal.fail} fail · {r.legal.warn} warn
    </Badge>
  )
}

const LINK_CLASS =
  'border-border hover:bg-muted border px-2.5 py-1 text-xs focus-visible:ring-2 focus-visible:ring-offset-2'

const SORTS: GallerySortOption<CampaignReport>[] = [
  { key: 'newest', label: 'Newest', compare: (a, b) => b.createdAt.localeCompare(a.createdAt) },
  { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  { key: 'owner', label: 'Owner', compare: (a, b) => a.ownerName.localeCompare(b.ownerName) },
  { key: 'runs', label: 'Most runs', compare: (a, b) => b.runs.length - a.runs.length },
]

const COLUMNS: GalleryColumn<CampaignReport>[] = [
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
    key: 'region',
    header: 'Region',
    width: 'minmax(0, 1fr)',
    cell: (c) => <span className="text-muted-foreground truncate">{c.region}</span>,
  },
  {
    key: 'runs',
    header: 'Runs',
    width: 'minmax(0, 0.6fr)',
    align: 'end',
    cell: (c) => <span className="text-muted-foreground tabular-nums">{c.runs.length}</span>,
  },
  {
    key: 'latest',
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
    key: 'created',
    header: 'Created',
    width: 'minmax(0, 1fr)',
    align: 'end',
    cell: (c) => (
      <span className="text-muted-foreground text-xs tabular-nums">{formatDate(c.createdAt)}</span>
    ),
  },
]

interface Confirm {
  kind: 'campaign' | 'run'
  id: string
}

export function ReportsView({ campaigns: initial }: { campaigns: CampaignReport[] }) {
  const [campaigns, setCampaigns] = useState(initial)
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const router = useRouter()

  const isConfirming = (kind: Confirm['kind'], id: string) =>
    confirm?.kind === kind && confirm.id === id

  async function removeCampaign(id: string) {
    setBusy(true)
    const res = await deleteCampaignAction(id)
    setBusy(false)
    setConfirm(null)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setCampaigns((list) => list.filter((c) => c.campaignId !== id))
    toast.success('Campaign deleted')
    router.refresh()
  }

  async function removeRun(campaignId: string, runId: string) {
    setBusy(true)
    const res = await deleteRunAction(runId)
    setBusy(false)
    setConfirm(null)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setCampaigns((list) =>
      list.map((c) =>
        c.campaignId === campaignId ? { ...c, runs: c.runs.filter((r) => r.runId !== runId) } : c,
      ),
    )
    toast.success('Run deleted')
    router.refresh()
  }

  function renderRunActions(c: CampaignReport, r: ReportRun) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Link
          href={`/runs/${r.runId}`}
          className={LINK_CLASS}
          style={{ borderRadius: 'var(--radius)' }}
        >
          Report
        </Link>
        <Link
          href={`/campaigns/${c.campaignId}/creatives`}
          className={LINK_CLASS}
          style={{ borderRadius: 'var(--radius)' }}
        >
          Creatives
        </Link>
        {isConfirming('run', r.runId) ? (
          <>
            <Button
              variant="danger"
              size="sm"
              onClick={() => removeRun(c.campaignId, r.runId)}
              disabled={busy}
            >
              Confirm
            </Button>
            <Button variant="outline" size="sm" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirm({ kind: 'run', id: r.runId })}
            aria-label="Delete run"
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    )
  }

  function renderCampaignCard(c: CampaignReport) {
    return (
      <section
        key={c.campaignId}
        className="border-border bg-card border p-4"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-medium">{c.name}</h2>
            <p className="text-muted-foreground text-xs">
              {c.ownerName} · {c.region} · {formatDateTime(c.createdAt)} · {c.runs.length} run
              {c.runs.length === 1 ? '' : 's'}
            </p>
          </div>
          {isConfirming('campaign', c.campaignId) ? (
            <span className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Delete campaign, runs &amp; creatives?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => removeCampaign(c.campaignId)}
                disabled={busy}
              >
                Confirm
              </Button>
              <Button variant="outline" size="sm" onClick={() => setConfirm(null)} disabled={busy}>
                Cancel
              </Button>
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirm({ kind: 'campaign', id: c.campaignId })}
              aria-label={`Delete campaign ${c.name}`}
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
              Delete campaign
            </Button>
          )}
        </div>

        {c.runs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No runs for this campaign.</p>
        ) : (
          <>
            {/* Desktop: a fixed-layout table — explicit, data-proportioned column
                tracks so it fills the card and never overflows (no horizontal scroll). */}
            <div className="hidden sm:block">
              <table className="w-full table-fixed text-left text-sm">
                {/* Proportional tracks (sum 100%) so the table always fills its card
                    and never overflows — widths weighted to each column's data. */}
                <colgroup>
                  <col style={{ width: '22%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '16%' }} />
                  <col style={{ width: '17%' }} />
                </colgroup>
                <thead>
                  <tr className="text-muted-foreground text-xs">
                    <th className="py-1 pr-3 font-medium">Status</th>
                    <th className="py-1 pr-3 text-right font-medium">Creatives</th>
                    <th className="py-1 pr-3 font-medium">Compliance</th>
                    <th className="py-1 pr-3 font-medium">Legal</th>
                    <th className="py-1 pr-3 text-right font-medium">Updated</th>
                    <th className="py-1 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {c.runs.map((r) => (
                    <tr key={r.runId} className="border-border border-t align-middle">
                      <td className="py-2 pr-3">{statusBadge(r)}</td>
                      <td
                        className="py-2 pr-3 text-right whitespace-nowrap tabular-nums"
                        title={`${r.totals.creatives ?? 0} creatives · ${r.totals.reused ?? 0} reused / ${r.totals.generated ?? 0} generated`}
                      >
                        {r.totals.creatives ?? 0}
                        <span className="text-muted-foreground text-xs">
                          {' '}
                          ·{r.totals.reused ?? 0}/{r.totals.generated ?? 0}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{complianceBadge(r)}</td>
                      <td className="py-2 pr-3">{legalBadge(r)}</td>
                      <td
                        className="text-muted-foreground py-2 pr-3 text-right text-xs whitespace-nowrap tabular-nums"
                        title={formatDateTime(r.finishedAt ?? r.startedAt)}
                      >
                        {formatShortDateTime(r.finishedAt ?? r.startedAt)}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap items-center justify-center gap-0.5">
                          <Link
                            href={`/runs/${r.runId}`}
                            title="Open report"
                            aria-label="Open report"
                            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 w-8 items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            style={{ borderRadius: 'var(--radius)' }}
                          >
                            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          <Link
                            href={`/campaigns/${c.campaignId}/creatives`}
                            title="Open creatives"
                            aria-label="Open creatives"
                            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 w-8 items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                            style={{ borderRadius: 'var(--radius)' }}
                          >
                            <ImageIcon className="h-4 w-4" aria-hidden="true" />
                          </Link>
                          {isConfirming('run', r.runId) ? (
                            <>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removeRun(c.campaignId, r.runId)}
                                disabled={busy}
                                className="px-2 text-xs"
                              >
                                Confirm
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirm(null)}
                                disabled={busy}
                                className="px-2 text-xs"
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setConfirm({ kind: 'run', id: r.runId })}
                              aria-label="Delete run"
                              title="Delete run"
                            >
                              <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: each run stacks into a label:value card. */}
            <ul className="flex flex-col gap-3 sm:hidden">
              {c.runs.map((r) => (
                <li
                  key={r.runId}
                  className="border-border flex flex-col gap-2 border p-3"
                  style={{ borderRadius: 'var(--radius)' }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {statusBadge(r)}
                    <span className="text-muted-foreground text-xs">
                      {formatDateTime(r.finishedAt ?? r.startedAt)}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground">Creatives</dt>
                      <dd>{r.totals.creatives ?? 0}</dd>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <dt className="text-muted-foreground">Reuse / gen</dt>
                      <dd>
                        {r.totals.reused ?? 0} / {r.totals.generated ?? 0}
                      </dd>
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <dt className="text-muted-foreground">Compliance</dt>
                      <dd>{complianceBadge(r)}</dd>
                    </div>
                    <div className="flex flex-col items-start gap-0.5">
                      <dt className="text-muted-foreground">Legal</dt>
                      <dd>{legalBadge(r)}</dd>
                    </div>
                  </dl>
                  {renderRunActions(c, r)}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    )
  }

  if (campaigns.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No runs yet. Start a campaign and its compliance, legal, and output reports show up here.
      </p>
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
      renderGrid={(items) => (
        <div className="flex flex-col gap-4">{items.map(renderCampaignCard)}</div>
      )}
    />
  )
}
