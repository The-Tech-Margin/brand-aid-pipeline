'use client'

// Public "Request access" modal: name / organization / email → submitAccessRequest.
// Toasts the result and closes on success. Used on the login, no-access, and landing
// surfaces (all outside the app auth guard). The Dialog renders null when closed, so the
// form remounts fresh each open — no manual reset needed.
import { useActionState, useEffect } from 'react'
import Image from 'next/image'
import { Dialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/feedback/toast'
import { useBrand } from '@/features/brand-identity/brand-context'
import { submitAccessRequest, type AccessRequestState } from '../actions'

interface RequestAccessModalProps {
  open: boolean
  onClose: () => void
}

const INITIAL: AccessRequestState = {}

export function RequestAccessModal({ open, onClose }: RequestAccessModalProps) {
  const [state, formAction, pending] = useActionState(submitAccessRequest, INITIAL)
  const toast = useToast()
  const brand = useBrand()

  useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.ok) {
      toast.success("Request sent — we'll email you if you're approved.")
      onClose()
    }
  }, [state, toast, onClose])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Request access"
      className="max-w-md"
      header={
        <div className="flex items-center gap-2 text-left">
          {brand.logoUrl && (
            <Image
              src={brand.logoUrl}
              alt=""
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 object-contain"
            />
          )}
          <span className="gradient-text font-display text-lg">{brand.businessName}</span>
        </div>
      }
    >
      <form action={formAction} className="flex flex-col gap-3 text-left">
        <Field label="Name" required>
          {({ inputId }) => (
            <Input id={inputId} name="name" autoComplete="name" maxLength={80} required />
          )}
        </Field>
        <Field label="Organization" required>
          {({ inputId }) => (
            <Input
              id={inputId}
              name="organization"
              autoComplete="organization"
              maxLength={120}
              required
            />
          )}
        </Field>
        <Field label="Email" required>
          {({ inputId }) => (
            <Input
              id={inputId}
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              required
            />
          )}
        </Field>
        <div className="mt-1 flex items-center justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Sending…' : 'Send request'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
