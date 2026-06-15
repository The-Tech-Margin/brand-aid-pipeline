'use client'

// Toast notifications — token-driven, accessible, reduced-motion safe.
// Each toast announces itself (role="status", or role="alert" for errors); the
// entrance transition collapses to ~0ms under the global prefers-reduced-motion
// rule. `useToast()` exposes success/error/info/warning; the provider renders the
// fixed viewport. Status is conveyed by icon + accent color, never color alone.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { AlertTriangleIcon, CheckIcon, XIcon } from '@/components/icons'
import { cn } from '@/lib/utils'

type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface ToastOptions {
  description?: string
  /** ms before auto-dismiss; 0 keeps it until dismissed. */
  duration?: number
}

interface ToastItem extends ToastOptions {
  id: number
  variant: ToastVariant
  message: string
  duration: number
}

export interface ToastApi {
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  dismiss: (id: number) => void
}

const ToastContext = createContext<ToastApi | null>(null)
const DEFAULT_DURATION = 5000

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const idRef = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const push = useCallback(
    (variant: ToastVariant, message: string, options?: ToastOptions) => {
      const id = ++idRef.current
      const duration = options?.duration ?? DEFAULT_DURATION
      setToasts((list) => [
        ...list,
        { id, variant, message, description: options?.description, duration },
      ])
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        )
      }
    },
    [dismiss],
  )

  // Pause auto-dismiss while a toast is hovered or focused, so keyboard / screen-reader
  // users have time to read it and reach the Dismiss button.
  const pause = useCallback((id: number) => {
    const t = timers.current.get(id)
    if (t) {
      clearTimeout(t)
      timers.current.delete(id)
    }
  }, [])

  const resume = useCallback(
    (id: number, duration: number) => {
      if (duration <= 0 || timers.current.has(id)) return
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), duration),
      )
    },
    [dismiss],
  )

  useEffect(() => {
    const map = timers.current
    return () => {
      map.forEach((t) => clearTimeout(t))
      map.clear()
    }
  }, [])

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, o) => push('success', m, o),
      error: (m, o) => push('error', m, o),
      info: (m, o) => push('info', m, o),
      warning: (m, o) => push('warning', m, o),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} onPause={pause} onResume={resume} />
    </ToastContext.Provider>
  )
}

const VARIANT_ACCENT: Record<ToastVariant, string> = {
  success: 'var(--brand-lime)',
  error: 'var(--brand-hot-red)',
  info: 'var(--brand-cyan)',
  warning: 'var(--brand-goldenrod)',
}

interface ViewportProps {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
  onPause: (id: number) => void
  onResume: (id: number, duration: number) => void
}

function ToastViewport({ toasts, onDismiss, onPause, onResume }: ViewportProps) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed right-0 bottom-0 flex w-full max-w-sm flex-col gap-2 p-4"
      style={{ zIndex: 'var(--z-overlay)' }}
    >
      {toasts.map((t) => (
        <ToastCard
          key={t.id}
          toast={t}
          onDismiss={onDismiss}
          onPause={onPause}
          onResume={onResume}
        />
      ))}
    </div>
  )
}

function ToastCard({
  toast,
  onDismiss,
  onPause,
  onResume,
}: {
  toast: ToastItem
  onDismiss: (id: number) => void
  onPause: (id: number) => void
  onResume: (id: number, duration: number) => void
}) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const Icon = toast.variant === 'success' ? CheckIcon : AlertTriangleIcon
  const accent = VARIANT_ACCENT[toast.variant]

  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => onPause(toast.id)}
      onMouseLeave={() => onResume(toast.id, toast.duration)}
      onFocusCapture={() => onPause(toast.id)}
      onBlurCapture={() => onResume(toast.id, toast.duration)}
      className={cn(
        'border-border bg-card pointer-events-auto flex items-start gap-3 border p-3 shadow-lg transition-all duration-200',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      )}
      style={{ borderRadius: 'var(--radius)', borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" style={{ color: accent }} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium break-words">{toast.message}</p>
        {toast.description && (
          <p className="text-muted-foreground mt-0.5 text-sm break-words">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="hover:bg-muted -m-1 inline-flex h-7 w-7 shrink-0 items-center justify-center focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{ borderRadius: 'var(--radius)' }}
      >
        <XIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
