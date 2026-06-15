// Types for automated brand-compliance checks on a composited creative.
import type { FramingMode } from '@/features/pipeline/compositor/compositor'

export type ComplianceStatus = 'pass' | 'warn' | 'fail'

export interface ComplianceCheck {
  check: string
  status: ComplianceStatus
  detail: string
}

export interface ComplianceContext {
  framingMode: FramingMode
  /** Expected brand palette (hex) for the brand-color-usage check. */
  brandPalette: string[]
  /** Overlay text color, for the message-contrast check. */
  messageColor: string
}
