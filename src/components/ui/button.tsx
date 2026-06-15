// Button primitive — token-driven variants/sizes via cva. Matches the brand
// button patterns (primary pink, cyan secondary, outline/ghost). See design-system.md.
import type { ButtonHTMLAttributes, Ref } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-brand-pink text-white hover:bg-brand-pink/90',
        secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
        outline: 'border-border hover:bg-card border',
        ghost: 'hover:bg-muted',
        danger: 'bg-brand-hot-red text-white hover:bg-brand-hot-red/90',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        default: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  },
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  ref?: Ref<HTMLButtonElement>
}

export function Button({ className, variant, size, style, ref, ...props }: ButtonProps) {
  return (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      style={{ borderRadius: 'var(--radius)', ...style }}
      {...props}
    />
  )
}
