// Chunked / resumable runner — spreads a campaign across serverless invocations,
// one product per step, so a long run (many image-generation calls) never exceeds a
// single function's time budget. Shares `runProduct` with the inline orchestrator.
//
//   startRun  → persist campaign + run, emit the opening events, return the runId
//   stepRun   → process the next product (or finalize when the cursor is past the end)
//
// The web layer drives these: inline mode loops stepRun in one background task;
// chunked mode self-chains one HTTP step per product.
import type { Brief } from '@/features/brief/schema'
import type { RunMode, RunStatus } from '@/types/database'
import { scanBrief } from '@/features/pipeline/legal/scanner'
import { defaultRules } from '@/features/pipeline/legal/lexicon'
import { safeTranslate } from '@/features/pipeline/translate/dictionary-translator'
import { slugify } from '@/lib/slug'
import { RunLogger } from '@/lib/logging/run-logger'
import { computeTotals, runProduct } from './run-campaign'
import type { RunDeps, RunState } from './types'

/**
 * Pick a run mode from the brief. Each product that must be generated is one
 * slow image-generation call; three or more risks the serverless ceiling, so those
 * run chunked. Callers may override this.
 */
export function chooseRunMode(brief: Brief): RunMode {
  const generations = brief.products.filter((p) => p.input_assets.length === 0).length
  return generations >= 3 ? 'chunked' : 'inline'
}

export interface StartRunResult {
  runId: string
  campaignId: string
}

/** Persist the campaign + run and emit the opening log events. No products yet. */
export async function startRun(
  brief: Brief,
  deps: RunDeps,
  mode: RunMode,
): Promise<StartRunResult> {
  const logger = new RunLogger()
  logger.info(
    'validate',
    `Starting ${mode} run for "${brief.campaign_name}" (${brief.products.length} products)`,
  )

  const legal = scanBrief(brief, deps.rules ?? defaultRules)
  logger.info(
    'legal',
    `Legal scan: ${legal.counts.fail} fail, ${legal.counts.warn} warn, ${legal.counts.info} info`,
    { counts: legal.counts },
  )

  const { campaignId } = await deps.persistence.createCampaign(brief, deps.userId)
  const runId = await deps.persistence.createRun(campaignId, deps.userId, brief, mode)
  logger.info('persist', `Created campaign ${campaignId} and run ${runId}`)

  await deps.persistence.saveEvents(runId, logger.list())
  return { runId, campaignId }
}

export interface StepResult {
  done: boolean
  status: RunStatus
  nextProductIndex: number
}

/**
 * Advance a run by one product, or finalize it once every product is processed.
 * Accepts an optional preloaded state to avoid a redundant read.
 */
export async function stepRun(
  deps: RunDeps,
  runId: string,
  preloaded?: RunState,
): Promise<StepResult> {
  const state = preloaded ?? (await deps.persistence.getRunState(runId))
  if (!state) return { done: true, status: 'failed', nextProductIndex: 0 }
  if (state.status === 'succeeded' || state.status === 'failed') {
    return { done: true, status: state.status, nextProductIndex: state.nextProductIndex }
  }

  const { brief, campaignId, nextProductIndex } = state
  if (nextProductIndex >= brief.products.length) {
    return finalize(deps, runId, state)
  }

  const product = brief.products[nextProductIndex]!
  const logger = new RunLogger()
  const productIds = await deps.persistence.loadProductIds(campaignId)
  const productId = productIds[slugify(product.name)]!
  const translation = await safeTranslate(deps.translator, brief.campaign_message, brief.locale)
  const messageColor = deps.framing.textColor ?? '#ffffff'

  await runProduct(product, {
    brief,
    campaignId,
    productId,
    deps,
    logger,
    messageText: translation.text,
    messageColor,
  })
  await deps.persistence.saveEvents(runId, logger.list())

  const next = nextProductIndex + 1
  await deps.persistence.advanceRunCursor(runId, next)
  if (next >= brief.products.length) {
    return finalize(deps, runId, { ...state, nextProductIndex: next })
  }
  return { done: false, status: 'running', nextProductIndex: next }
}

/** Compute totals from the persisted creatives and close out the run. */
async function finalize(deps: RunDeps, runId: string, state: RunState): Promise<StepResult> {
  const logger = new RunLogger()
  const { brief, campaignId } = state
  const creatives = await deps.persistence.loadCreativeResults(campaignId)
  const translation = await safeTranslate(deps.translator, brief.campaign_message, brief.locale)
  const producedSlugs = new Set(creatives.map((c) => c.productSlug))
  const failedCount = brief.products.length - producedSlugs.size
  const durationMs = Date.now() - Date.parse(state.startedAt)
  const totals = computeTotals(brief, creatives, failedCount, translation.translated, durationMs)
  const status: RunStatus = creatives.length > 0 ? 'succeeded' : 'failed'

  await deps.persistence.finalizeRun(runId, status, totals)
  logger.info(
    'report',
    `Run ${status}: ${totals.creatives} creatives, ${totals.compliancePassRate}% compliance pass`,
  )
  await deps.persistence.saveEvents(runId, logger.list())
  return { done: true, status, nextProductIndex: brief.products.length }
}
