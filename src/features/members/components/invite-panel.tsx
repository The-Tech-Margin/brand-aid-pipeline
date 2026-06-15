'use client'

// Admin-only panel: invite a visitor by email directly (bypassing the request queue).
// Submits the invite server action; surfaces success/error as toasts. The member LIST
// lives in MembersPanel (the Members tab); this is just the quick-invite form.
import { useActionState, useEffect } from 'react'
import { inviteVisitor, type InviteState } from '@/features/members/actions'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/feedback/toast'

const INITIAL: InviteState = {}

export function InvitePanel() {
  const [state, formAction, pending] = useActionState(inviteVisitor, INITIAL)
  const toast = useToast()

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.invited) toast.success(`Invite sent to ${state.invited}`)
  }, [state.error, state.invited, toast])

  return (
    <section
      className="border-border bg-card border p-4"
      style={{ borderRadius: 'var(--radius)' }}
      aria-labelledby="invite-heading"
    >
      <h2 id="invite-heading" className="mb-1 text-sm font-semibold">
        Invite a visitor
      </h2>
      <p className="text-muted-foreground mb-3 text-xs">
        Send an invite directly by email. Visitors sign in by magic link and can run the full
        pipeline on their own records.
      </p>

      <form action={formAction} className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1 sm:min-w-56">
          <Field label="Email" required>
            {({ inputId }) => (
              <Input id={inputId} name="email" type="email" autoComplete="off" required />
            )}
          </Field>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Inviting…' : 'Send invite'}
        </Button>
      </form>
    </section>
  )
}
