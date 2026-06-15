// Shown to a signed-in user who isn't an active member (invite-only). Offers a
// sign-out so they can switch accounts; outside the (app) group to avoid a
// redirect loop with the membership gate.
import { signOut } from '@/features/auth/actions'
import { RequestAccessButton } from '@/features/visitor-requests/components/request-access-button'

export default function NoAccessPage() {
  return (
    <main
      id="content"
      className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center"
    >
      <p className="gradient-text mb-1 text-4xl leading-[1.4] font-semibold">Invite only</p>
      <h1 className="mb-2 text-2xl font-semibold">You&rsquo;re not on the list yet</h1>
      <p className="text-muted-foreground mb-6 max-w-md text-sm">
        Brand Helper is currently invite-only. Request access below, or ask an admin to invite your
        email — then sign in with the link they send.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <RequestAccessButton variant="primary" />
        <form action={signOut}>
          <button
            type="submit"
            className="border-border hover:bg-card border px-4 py-2 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ borderRadius: 'var(--radius)' }}
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  )
}
