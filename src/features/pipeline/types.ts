// Pipeline contracts — the orchestrator depends on these ports/types, not on
// Supabase or the image gateway directly, so it runs against mocks in tests.
import type { AspectRatio, Brief } from '@/features/brief/schema'
import type { BrandFraming } from '@/features/pipeline/compositor/compositor'
import type { ComplianceCheck } from '@/features/pipeline/compliance/types'
import type { LegalScanResult, LexiconRule } from '@/features/pipeline/legal/types'
import type { ImageGenerator } from '@/services/image/types'
import type { Translator } from '@/features/pipeline/translate/types'
import type { RunStatus, RunMode, EventLevel } from '@/types/database'

export interface RunEvent {
  level: EventLevel
  stage: string
  message: string
  meta?: Record<string, unknown>
  at: number
}

export interface CreativeResult {
  productName: string
  productSlug: string
  ratio: AspectRatio
  source: 'reused' | 'generated'
  storagePath: string
  assetId: string
  width: number
  height: number
  compliance: ComplianceCheck[]
}

export type RunTotals = {
  products: number
  generated: number
  reused: number
  creatives: number
  failedProducts: number
  compliancePassRate: number
  localized: boolean
  durationMs: number
}

export interface RunResult {
  runId: string
  campaignId: string
  status: RunStatus
  creatives: CreativeResult[]
  failedProducts: { product: string; error: string }[]
  legal: LegalScanResult
  events: RunEvent[]
  totals: RunTotals
  startedAt: number
  finishedAt: number
}

export interface SaveCreativeArgs {
  campaignId: string
  productId: string
  productSlug: string
  productName: string
  ratio: AspectRatio
  source: 'reused' | 'generated'
  bytes: Buffer
  width: number
  height: number
}

/** Resumable execution state for a run, read between chunked steps. */
export interface RunState {
  campaignId: string
  userId: string
  brief: Brief
  mode: RunMode
  nextProductIndex: number
  status: RunStatus
  startedAt: string
}

/** Persistence port — implemented for real by Supabase, mocked in tests. */
export interface PipelinePersistence {
  createCampaign(
    brief: Brief,
    userId: string,
  ): Promise<{ campaignId: string; productIds: Record<string, string> }>
  createRun(campaignId: string, userId: string, brief: Brief, mode: RunMode): Promise<string>
  saveCreative(args: SaveCreativeArgs): Promise<{ assetId: string; storagePath: string }>
  saveComplianceResults(assetId: string, checks: ComplianceCheck[]): Promise<void>
  /** Append events to the run log; called incrementally so progress streams live. */
  saveEvents(runId: string, events: RunEvent[]): Promise<void>
  finalizeRun(runId: string, status: RunStatus, totals: RunTotals): Promise<void>
  /** Load input-asset bytes for the reuse path; returns null if not found. */
  loadInputAsset(campaignId: string, path: string): Promise<Uint8Array | null>
  // --- chunked / resumable execution support ---
  getRunState(runId: string): Promise<RunState | null>
  advanceRunCursor(runId: string, nextProductIndex: number): Promise<void>
  loadProductIds(campaignId: string): Promise<Record<string, string>>
  loadCreativeResults(campaignId: string): Promise<CreativeResult[]>
}

export interface RunDeps {
  userId: string
  imageGenerator: ImageGenerator
  translator: Translator
  persistence: PipelinePersistence
  rules?: LexiconRule[]
  framing: BrandFraming
  brandPalette: string[]
}
