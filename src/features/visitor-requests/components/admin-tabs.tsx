'use client'

// Client wrapper for the admin visitor-management area: two GalleryView panels
// (Requests | Members) under a single tablist, so only one toolbar shows at a time.
import { useState } from 'react'
import { Tabs } from '@/components/ui/tabs'
import { RequestsPanel } from './requests-panel'
import { MembersPanel } from '@/features/members/components/members-panel'
import type { AccessRequestRow, MemberRow } from '@/types/database'

interface AdminTabsProps {
  requests: AccessRequestRow[]
  members: MemberRow[]
}

export function AdminTabs({ requests, members }: AdminTabsProps) {
  const [value, setValue] = useState('requests')
  const pending = requests.filter((r) => r.status === 'pending').length

  return (
    <Tabs
      label="Visitor management"
      value={value}
      onValueChange={setValue}
      items={[
        { value: 'requests', label: pending > 0 ? `Requests (${pending})` : 'Requests' },
        { value: 'members', label: 'Members' },
      ]}
      panels={{
        requests: <RequestsPanel requests={requests} />,
        members: <MembersPanel members={members} />,
      }}
    />
  )
}
