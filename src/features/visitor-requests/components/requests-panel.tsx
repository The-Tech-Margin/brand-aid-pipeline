'use client'

// Admin review of access requests. Accept (single click — sends the invite) or Deny
// (two-step inline confirm). Wrapped in the shared GalleryView for search / sort / list.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  GalleryView,
  type GalleryColumn,
  type GallerySortOption,
} from '@/components/ui/gallery-view'
import { useToast } from '@/components/feedback/toast'
import { formatDate } from '@/lib/format'
import { approveAccessRequest, denyAccessRequest } from '../actions'
import type { AccessRequestRow } from '@/types/database'
import { RequestStatusBadge } from './request-status-badge'

const SORTS: GallerySortOption<AccessRequestRow>[] = [
  { key: 'newest', label: 'Newest', compare: (a, b) => b.created_at.localeCompare(a.created_at) },
  { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  {
    key: 'org',
    label: 'Organization',
    compare: (a, b) => a.organization.localeCompare(b.organization),
  },
  { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) },
]

export function RequestsPanel({ requests }: { requests: AccessRequestRow[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const router = useRouter()

  async function accept(id: string) {
    setBusy(true)
    const res = await approveAccessRequest(id)
    setBusy(false)
    if (res.error) return toast.error(res.error)
    toast.success('Request approved — invite sent.')
    router.refresh()
  }

  async function deny(id: string) {
    setBusy(true)
    const res = await denyAccessRequest(id)
    setBusy(false)
    setConfirmId(null)
    if (res.error) return toast.error(res.error)
    toast.success('Request denied.')
    router.refresh()
  }

  function renderActions(r: AccessRequestRow) {
    if (r.status !== 'pending') {
      return <span className="text-muted-foreground text-xs">—</span>
    }
    if (confirmId === r.id) {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="danger" size="sm" onClick={() => deny(r.id)} disabled={busy}>
            Confirm
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmId(null)} disabled={busy}>
            Cancel
          </Button>
        </div>
      )
    }
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        <Button variant="secondary" size="sm" onClick={() => accept(r.id)} disabled={busy}>
          Accept
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmId(r.id)}
          aria-label={`Deny request from ${r.name}`}
        >
          Deny
        </Button>
      </div>
    )
  }

  const columns: GalleryColumn<AccessRequestRow>[] = [
    {
      key: 'name',
      header: 'Name',
      width: 'minmax(0, 1.4fr)',
      cell: (r) => <span className="truncate font-medium">{r.name}</span>,
    },
    {
      key: 'organization',
      header: 'Organization',
      width: 'minmax(0, 1.4fr)',
      cell: (r) => <span className="text-muted-foreground truncate">{r.organization}</span>,
    },
    {
      key: 'email',
      header: 'Email',
      width: 'minmax(0, 1.8fr)',
      cell: (r) => <span className="truncate">{r.email}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: 'minmax(0, 0.8fr)',
      cell: (r) => <RequestStatusBadge status={r.status} />,
    },
    {
      key: 'requested',
      header: 'Requested',
      width: 'minmax(0, 0.9fr)',
      align: 'end',
      cell: (r) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDate(r.created_at)}
        </span>
      ),
    },
    { key: 'actions', header: 'Actions', width: 'minmax(0, 1.4fr)', cell: renderActions },
  ]

  return (
    <GalleryView
      label="requests"
      items={requests}
      getKey={(r) => r.id}
      getSearchText={(r) => `${r.name} ${r.organization} ${r.email} ${r.status}`}
      getRowLabel={(r) => `${r.name} — ${r.email}`}
      sorts={SORTS}
      columns={columns}
      initialView="list"
      searchPlaceholder="Search requests…"
      emptyMessage="No access requests yet."
      renderGrid={(items) => (
        <ul className="flex flex-col gap-2">
          {items.map((r) => (
            <li
              key={r.id}
              className="border-border bg-card flex flex-col gap-2 border p-3"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{r.name}</span>
                <RequestStatusBadge status={r.status} />
              </div>
              <p className="text-muted-foreground text-xs">
                {r.organization} · {r.email} · {formatDate(r.created_at)}
              </p>
              {renderActions(r)}
            </li>
          ))}
        </ul>
      )}
    />
  )
}
