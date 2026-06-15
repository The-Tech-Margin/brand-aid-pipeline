// Dedicated admin area — members + invites. The (app) layout already guards active
// membership; this page additionally requires the admin role and bounces visitors
// back to their dashboard (defence in depth on top of the server-action + RLS checks).
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getMyMembership, listMembers } from '@/features/members/data'
import { listAccessRequests } from '@/features/visitor-requests/data'
import { InvitePanel } from '@/features/members/components/invite-panel'
import { AdminTabs } from '@/features/visitor-requests/components/admin-tabs'

export const metadata = {
  title: 'Admin · Brand Helper',
}

export default async function AdminPage() {
  const membership = await getMyMembership()
  if (membership?.role !== 'admin' || membership.status !== 'active') redirect('/dashboard')

  const [members, requests] = await Promise.all([listMembers(), listAccessRequests()])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-3xl leading-[1.4] font-semibold">
          <span className="gradient-text">Admin</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review access requests, manage visitors, and invite members directly. Visitors sign in by
          magic link and run the pipeline on their own records.
        </p>
      </div>
      <InvitePanel />
      <AdminTabs requests={requests} members={members} />
    </div>
  )
}
