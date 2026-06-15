'use client'

// Admin member list with full visibility + soft revoke / re-instate. Wrapped in the
// shared GalleryView (search / sort / list). The invite FORM lives separately in
// InvitePanel; this is the list half.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GalleryView,
  type GalleryColumn,
  type GallerySortOption,
} from '@/components/ui/gallery-view'
import { useToast } from '@/components/feedback/toast'
import { formatDate } from '@/lib/format'
import { reinstateVisitor, revokeVisitor } from '@/features/visitor-requests/actions'
import type { MemberRow, MemberStatus } from '@/types/database'

const STATUS_TONE: Record<MemberStatus, BadgeTone> = {
  active: 'success',
  invited: 'info',
  revoked: 'danger',
}

function statusBadge(m: MemberRow) {
  return <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
}

const SORTS: GallerySortOption<MemberRow>[] = [
  { key: 'email', label: 'Email (A–Z)', compare: (a, b) => a.email.localeCompare(b.email) },
  { key: 'role', label: 'Role', compare: (a, b) => a.role.localeCompare(b.role) },
  { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) },
]

export function MembersPanel({ members }: { members: MemberRow[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const router = useRouter()

  async function revoke(userId: string) {
    setBusy(true)
    const res = await revokeVisitor(userId)
    setBusy(false)
    setConfirmId(null)
    if (res.error) return toast.error(res.error)
    toast.success('Access revoked.')
    router.refresh()
  }

  async function reinstate(userId: string) {
    setBusy(true)
    const res = await reinstateVisitor(userId)
    setBusy(false)
    if (res.error) return toast.error(res.error)
    toast.success('Access re-instated.')
    router.refresh()
  }

  function renderActions(m: MemberRow) {
    // Admins can't be revoked; rows without a user_id have never signed in.
    if (m.role === 'admin' || !m.user_id) {
      return <span className="text-muted-foreground text-xs">—</span>
    }
    const userId = m.user_id
    if (m.status === 'revoked') {
      return (
        <Button variant="secondary" size="sm" onClick={() => reinstate(userId)} disabled={busy}>
          Re-instate
        </Button>
      )
    }
    if (confirmId === m.id) {
      return (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button variant="danger" size="sm" onClick={() => revoke(userId)} disabled={busy}>
            Confirm
          </Button>
          <Button variant="outline" size="sm" onClick={() => setConfirmId(null)} disabled={busy}>
            Cancel
          </Button>
        </div>
      )
    }
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirmId(m.id)}
        aria-label={`Revoke access for ${m.email}`}
      >
        Revoke
      </Button>
    )
  }

  const columns: GalleryColumn<MemberRow>[] = [
    {
      key: 'email',
      header: 'Email',
      width: 'minmax(0, 1.8fr)',
      cell: (m) => <span className="truncate">{m.email}</span>,
    },
    {
      key: 'name',
      header: 'Name',
      width: 'minmax(0, 1.2fr)',
      cell: (m) => <span className="truncate">{m.full_name ?? '—'}</span>,
    },
    {
      key: 'organization',
      header: 'Organization',
      width: 'minmax(0, 1.2fr)',
      cell: (m) => <span className="text-muted-foreground truncate">{m.organization ?? '—'}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      width: 'minmax(0, 0.7fr)',
      cell: (m) => <span className="text-muted-foreground capitalize">{m.role}</span>,
    },
    { key: 'status', header: 'Status', width: 'minmax(0, 0.8fr)', cell: statusBadge },
    {
      key: 'joined',
      header: 'Joined',
      width: 'minmax(0, 0.9fr)',
      align: 'end',
      cell: (m) => (
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatDate(m.activated_at ?? m.created_at)}
        </span>
      ),
    },
    { key: 'actions', header: 'Actions', width: 'minmax(0, 1.2fr)', cell: renderActions },
  ]

  return (
    <GalleryView
      label="members"
      items={members}
      getKey={(m) => m.id}
      getSearchText={(m) =>
        `${m.email} ${m.full_name ?? ''} ${m.organization ?? ''} ${m.role} ${m.status}`
      }
      getRowLabel={(m) => m.email}
      sorts={SORTS}
      columns={columns}
      initialView="list"
      searchPlaceholder="Search members…"
      emptyMessage="No members match your search."
      renderGrid={(items) => (
        <ul className="flex flex-col gap-2">
          {items.map((m) => (
            <li
              key={m.id}
              className="border-border bg-card flex flex-col gap-2 border p-3"
              style={{ borderRadius: 'var(--radius)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm">{m.email}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground text-xs capitalize">{m.role}</span>
                  {statusBadge(m)}
                </span>
              </div>
              {(m.full_name || m.organization) && (
                <p className="text-muted-foreground text-xs">
                  {[m.full_name, m.organization].filter(Boolean).join(' · ')}
                </p>
              )}
              {renderActions(m)}
            </li>
          ))}
        </ul>
      )}
    />
  )
}
