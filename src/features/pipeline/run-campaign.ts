// Pipeline orchestrator — the heart of Brand Helper. Reads top-to-bottom:
// validate → legal scan → persist campaign/run → translate → per product
// (reuse | generate) → composite per ratio → compliance → persist → totals.
// One product failing is recorded and skipped; it never aborts the run.
//
// `runCampaign` is the all-in-one inline path (used by the CLI and tests). The
// per-product `runProduct` step is shared with the chunked runner (./chunked.ts),
// which spreads the same work across serverless invocations to dodge timeouts.
import type { Brief } from '@/features/brief/schema'
import { buildHeroPrompt } from '@/services/image/prompt'
import { composeCreative } from '@/features/pipeline/compositor/compositor'
import { runComplianceChecks } from '@/features/pipeline/compliance/checks'
import { scanBrief } from '@/features/pipeline/legal/scanner'
import { defaultRules } from '@/features/pipeline/legal/lexicon'
import { safeTranslate } from '@/features/pipeline/translate/dictionary-translator'
import { slugify } from '@/lib/slug'
import { RunLogger } from '@/lib/logging/run-logger'
import type { CreativeResult, RunDeps, RunResult, RunTotals } from './types'

export function computeTotals(
  brief: Brief,
  creatives: CreativeResult[],
  failedCount: number,
  localized: boolean,
  durationMs: number,
): RunTotals {
  const checks = creatives.flatMap((c) => c.compliance)
  const passes = checks.filter((c) => c.status === 'pass').length
  return {
    products: brief.products.length,
    generated: new Set(creatives.filter((c) => c.source === 'generated').map((c) => c.productSlug))
      .size,
    reused: new Set(creatives.filter((c) => c.source === 'reused').map((c) => c.productSlug)).size,
    creatives: creatives.length,
    failedProducts: failedCount,
    compliancePassRate: checks.length ? Math.round((passes / checks.length) * 100) : 0,
    localized,
    durationMs,
  }
}

/** Everything one product needs to be composited across every ratio. */
export interface ProductRunContext {
  brief: Brief
  campaignId: string
  productId: string
  deps: RunDeps
  logger: RunLogger
  /** Localized (or English) overlay text. */
  messageText: string
  messageColor: string
}

/**
 * Resolve, composite, persist and compliance-check one product across all ratios.
 * Catches its own failure so a single bad product never aborts the campaign — the
 * error is logged and returned for the totals.
 */
export async function runProduct(
  product: Brief['products'][number],
  ctx: ProductRunContext,
): Promise<{ creatives: CreativeResult[]; failed?: { product: string; error: string } }> {
  const { brief, campaignId, productId, deps, logger, messageText, messageColor } = ctx
  const { framing, brandPalette, persistence } = deps
  const productSlug = slugify(product.name)
  const creatives: CreativeResult[] = []

  try {
    const { hero, source } = await resolveHero(brief, product, campaignId, deps, logger)

    for (const ratio of brief.aspect_ratios) {
      const creative = await composeCreative({ hero, ratio, message: messageText, framing })
      const { assetId, storagePath } = await persistence.saveCreative({
        campaignId,
        productId,
        productSlug,
        productName: product.name,
        ratio,
        source,
        bytes: creative.bytes,
        width: creative.width,
        height: creative.height,
      })
      const compliance = await runComplianceChecks(
        creative.bytes,
        creative.width,
        creative.height,
        {
          framingMode: framing.mode,
          brandPalette,
          messageColor,
        },
      )
      await persistence.saveComplianceResults(assetId, compliance)
      creatives.push({
        productName: product.name,
        productSlug,
        ratio,
        source,
        storagePath,
        assetId,
        width: creative.width,
        height: creative.height,
        compliance,
      })
      logger.info('composite', `Composited ${product.name} ${ratio} (${source})`, {
        compliance: compliance.map((c) => `${c.check}:${c.status}`),
      })
    }
    return { creatives }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error('product', `Product "${product.name}" failed: ${message}`)
    return { creatives, failed: { product: product.name, error: message } }
  }
}

export async function runCampaign(brief: Brief, deps: RunDeps): Promise<RunResult> {
  const startedAt = Date.now()
  const logger = new RunLogger()
  const { translator, persistence, framing } = deps
  const messageColor = framing.textColor ?? '#ffffff'

  logger.info(
    'validate',
    `Starting run for "${brief.campaign_name}" (${brief.products.length} products)`,
  )

  const legal = scanBrief(brief, deps.rules ?? defaultRules)
  logger.info(
    'legal',
    `Legal scan: ${legal.counts.fail} fail, ${legal.counts.warn} warn, ${legal.counts.info} info`,
    { counts: legal.counts },
  )

  const { campaignId, productIds } = await persistence.createCampaign(brief, deps.userId)
  const runId = await persistence.createRun(campaignId, deps.userId, brief, 'inline')
  logger.info('persist', `Created campaign ${campaignId} and run ${runId}`)

  // Stream events as they happen by flushing the delta after each stage.
  let persisted = 0
  const flush = async () => {
    const all = logger.list()
    if (all.length > persisted) {
      await persistence.saveEvents(runId, all.slice(persisted))
      persisted = all.length
    }
  }
  await flush()

  const translation = await safeTranslate(translator, brief.campaign_message, brief.locale)
  logger.info(
    'translate',
    translation.translated
      ? `Localized message to ${translation.locale}`
      : 'Using English message (no localization)',
  )

  const creatives: CreativeResult[] = []
  const failedProducts: { product: string; error: string }[] = []

  for (const product of brief.products) {
    const productId = productIds[slugify(product.name)]!
    const res = await runProduct(product, {
      brief,
      campaignId,
      productId,
      deps,
      logger,
      messageText: translation.text,
      messageColor,
    })
    creatives.push(...res.creatives)
    if (res.failed) failedProducts.push(res.failed)
    await flush()
  }

  const finishedAt = Date.now()
  const totals = computeTotals(
    brief,
    creatives,
    failedProducts.length,
    translation.translated,
    finishedAt - startedAt,
  )
  const status = creatives.length > 0 ? 'succeeded' : 'failed'

  await persistence.finalizeRun(runId, status, totals)
  logger.info(
    'report',
    `Run ${status}: ${totals.creatives} creatives, ${totals.compliancePassRate}% compliance pass`,
  )
  await flush()

  return {
    runId,
    campaignId,
    status,
    creatives,
    failedProducts,
    legal,
    events: logger.list(),
    totals,
    startedAt,
    finishedAt,
  }
}

/** Reuse an uploaded input asset when present, otherwise generate via the AI Gateway. */
async function resolveHero(
  brief: Brief,
  product: Brief['products'][number],
  campaignId: string,
  deps: RunDeps,
  logger: RunLogger,
): Promise<{ hero: Uint8Array; source: 'reused' | 'generated' }> {
  for (const assetPath of product.input_assets) {
    const bytes = await deps.persistence.loadInputAsset(campaignId, assetPath)
    if (bytes) {
      logger.info('resolve', `Reusing input asset "${assetPath}" for ${product.name}`)
      return { hero: bytes, source: 'reused' }
    }
    logger.warn(
      'resolve',
      `Input asset "${assetPath}" not found for ${product.name}; will generate`,
    )
  }

  const model = brief.image_model ?? 'openai'
  const { prompt, negativePrompt } = buildHeroPrompt(brief, product)
  logger.info('generate', `Generating hero for ${product.name} with ${model}`)
  const start = Date.now()
  const image = await deps.imageGenerator.generateHero(prompt, {
    negativePrompt,
    localeCode: brief.locale,
  })
  logger.info('generate', `${model} returned hero for ${product.name}`, {
    latencyMs: Date.now() - start,
    contentType: image.contentType,
  })
  return { hero: image.bytes, source: 'generated' }
}
