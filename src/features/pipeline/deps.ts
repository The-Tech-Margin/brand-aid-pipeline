// Run-dependency factory — the single place the real adapters are assembled, so
// the web routes and the CLI build identical pipelines. Server-only (pulls in the
// admin client + AI Gateway image client).
import 'server-only'
import type { Brief } from '@/features/brief/schema'
import { GatewayImageClient } from '@/services/image/gateway-client'
import { DEFAULT_IMAGE_MODEL } from '@/services/image/model-map'
import { DictionaryTranslator } from '@/features/pipeline/translate/dictionary-translator'
import type { BrandFraming, FramingMode } from '@/features/pipeline/compositor/compositor'
import { SupabasePersistence } from './supabase-persistence'
import type { RunDeps } from './types'

/** Brand framing derived from the brief — branded by default, palette → color bar. */
export function framingFromBrief(brief: Brief, mode: FramingMode = 'branded'): BrandFraming {
  return { mode, barColors: brief.brand_palette ?? [] }
}

export function buildRunDeps(userId: string, brief: Brief): RunDeps {
  return {
    userId,
    imageGenerator: new GatewayImageClient(brief.image_model ?? DEFAULT_IMAGE_MODEL),
    translator: new DictionaryTranslator(),
    persistence: new SupabasePersistence(userId),
    framing: framingFromBrief(brief),
    brandPalette: brief.brand_palette ?? [],
  }
}
