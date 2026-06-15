'use client'

// Magic-link sign-in form. Email only — on submit the server action emails a
// one-time sign-in link (access is invite-only). Surfaces a "check your email"
// state plus rate-limit errors inline (role="alert") and as a toast.
import { useActionState, useEffect, useId } from 'react'
import { requestMagicLink, type AuthState } from '@/app/login/actions'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/feedback/toast'
import { CheckIcon } from '@/components/icons'
import { RequestAccessButton } from '@/features/visitor-requests/components/request-access-button'

interface LoginFormProps {
  redirectTo: string
}

const INITIAL: AuthState = {}

export function LoginForm({ redirectTo }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(requestMagicLink, INITIAL)
  const errorId = useId()
  const toast = useToast()

  useEffect(() => {
    if (state.error) toast.error(state.error)
  }, [state.error, toast])

  if (state.sent) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-4 text-center">
        <CheckIcon className="text-brand-lime h-8 w-8" aria-hidden="true" />
        <p className="text-sm">
          Check your email for a sign-in link. If you&rsquo;re on the invite list, it&rsquo;s on its
          way.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="redirectTo" value={redirectTo} />

      <Field label="Email" required>
        {({ inputId }) => (
          <Input
            id={inputId}
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={state.error ? errorId : undefined}
          />
        )}
      </Field>

      {state.error && (
        <p id={errorId} role="alert" className="text-brand-hot-red text-sm">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? 'Sending…' : 'Email me a sign-in link'}
      </Button>

      <div className="flex flex-col items-center gap-2">
        <p className="text-muted-foreground text-center text-xs">
          Brand Helper is invite-only — don&rsquo;t have an invite?
        </p>
        <RequestAccessButton variant="outline" size="sm" />
      </div>
    </form>
  )
}
