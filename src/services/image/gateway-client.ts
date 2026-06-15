// Vercel AI Gateway image client. Generates a single high-res square master per
// call (the compositor derives each aspect ratio locally) and edits images for the
// in-app editor. Resilient: timeout, bounded exponential backoff with jitter, typed
// errors. Auth is the server-only AI_GATEWAY_API_KEY (read by the SDK; asserted here
// for a clear failure when unset).
import 'server-only'
import { experimental_generateImage as generateImage, gateway } from 'ai'
import { env } from '@/config/env'
import { resolveModel } from './model-map'
import {
  ImageGenError,
  type GenerateHeroOptions,
  type HeroImage,
  type ImageEditOptions,
  type ImageEditor,
  type ImageGenerator,
  type ImageGenStage,
  type ImageModelId,
} from './types'

const DEFAULT_SIZE = 1024
const MAX_RETRIES = 3
const TIMEOUT_MS = 90_000
const MAX_BACKOFF_MS = 8_000
// gpt-image-1 is the edit-capable model; edits always route here regardless of the
// campaign's generation model (FLUX/Imagen don't accept an input-image prompt).
const EDIT_MODEL = 'openai/gpt-image-1'

function backoffDelay(attempt: number): number {
  return Math.min(MAX_BACKOFF_MS, 500 * 2 ** attempt) + Math.floor(Math.random() * 300)
}

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

function sizeString(width: number, height: number): `${number}x${number}` {
  return `${width}x${height}` as `${number}x${number}`
}

type ImageCall = (signal: AbortSignal) => ReturnType<typeof generateImage>

export class GatewayImageClient implements ImageGenerator, ImageEditor {
  constructor(private readonly model: ImageModelId) {}

  async generateHero(prompt: string, opts: GenerateHeroOptions = {}): Promise<HeroImage> {
    const cfg = resolveModel(this.model)
    const width = opts.width ?? DEFAULT_SIZE
    const height = opts.height ?? DEFAULT_SIZE
    const sizing =
      cfg.sizing === 'size'
        ? { size: sizeString(width, height) }
        : { aspectRatio: '1:1' as `${number}:${number}` }
    const fullPrompt = opts.negativePrompt ? `${prompt} Avoid: ${opts.negativePrompt}.` : prompt

    return this.run(
      'generate',
      (signal) =>
        generateImage({
          model: gateway.image(cfg.modelId),
          prompt: fullPrompt,
          seed: opts.seed,
          maxRetries: 0,
          abortSignal: signal,
          ...sizing,
        }),
      width,
      height,
      opts.seed,
    )
  }

  async editImage(image: Uint8Array, opts: ImageEditOptions): Promise<HeroImage> {
    const width = opts.width ?? DEFAULT_SIZE
    const height = opts.height ?? DEFAULT_SIZE

    return this.run(
      'edit',
      (signal) =>
        generateImage({
          model: gateway.image(EDIT_MODEL),
          prompt: { images: [image], text: opts.prompt, mask: opts.mask },
          size: sizeString(width, height),
          maxRetries: 0,
          abortSignal: signal,
        }),
      width,
      height,
    )
  }

  private async run(
    stage: Exclude<ImageGenStage, 'decode'>,
    call: ImageCall,
    width: number,
    height: number,
    seed?: number,
  ): Promise<HeroImage> {
    env.aiGatewayApiKey() // fail fast with a clear message when the key is missing

    let lastError: ImageGenError | undefined
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
      try {
        const result = await call(controller.signal)
        const file = result.images[0]
        if (!file) {
          throw new ImageGenError('image model returned no image', 'decode', undefined, false)
        }
        return {
          bytes: file.uint8Array,
          contentType: file.mediaType ?? 'image/png',
          width,
          height,
          seed,
        }
      } catch (error) {
        if (error instanceof ImageGenError && !error.retryable) throw error
        const message =
          (error as Error).name === 'AbortError'
            ? `image ${stage} timed out`
            : (error as Error).message
        lastError =
          error instanceof ImageGenError
            ? error
            : new ImageGenError(message, stage, undefined, true)
        if (attempt === MAX_RETRIES) throw lastError
        await wait(backoffDelay(attempt))
      } finally {
        clearTimeout(timer)
      }
    }
    throw lastError ?? new ImageGenError(`image ${stage} failed`, stage)
  }
}
