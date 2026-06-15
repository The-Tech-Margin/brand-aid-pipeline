'use client'

// Drop-in "Request access" trigger for the public surfaces (login, no-access, landing).
// Owns the modal open state so the server pages can render it as a one-liner.
import { useState } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { RequestAccessModal } from './request-access-modal'

interface RequestAccessButtonProps {
  variant?: ButtonProps['variant']
  size?: ButtonProps['size']
  label?: string
  className?: string
}

export function RequestAccessButton({
  variant = 'outline',
  size = 'default',
  label = 'Request access',
  className,
}: RequestAccessButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <RequestAccessModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
