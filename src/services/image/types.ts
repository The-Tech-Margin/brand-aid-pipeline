// Image-generation service contract. The pipeline depends on these interfaces,
// never on a specific provider's HTTP shape, so the model can be swapped behind
// them. Client-safe (no `server-only`, no `ai` import) so the brief schema/form can
// reuse IMAGE_MODELS — the gateway call lives only in gateway-client.ts.

/** Providers the model dropdown offers, routed through the Vercel AI Gateway. */
export const IMAGE_MODELS = ['openai', 'replicate', 'google'] as const
export type ImageModelId = (typeof IMAGE_MODELS)[number]

/** Human labels for the dropdown — single source of truth for schema + registry. */
export const IMAGE_MODEL_LABELS: Record<ImageModelId, string> = {
  openai: 'OpenAI (gpt-image-1)',
  replicate: 'Replicate (FLUX)',
  google: 'Google (Imagen)',
}

export interface HeroImage {
  bytes: Uint8Array
  contentType: string
  width: number
  height: number
  seed?: number
}

export interface GenerateHeroOptions {
  width?: number
  height?: number
  negativePrompt?: string
  seed?: number
  /** Carried for parity with the old client; ignored by providers that don't bias. */
  localeCode?: string
}

export interface ImageEditOptions {
  /** Instruction for the edit (e.g. remove background, replace the subject). */
  prompt: string
  width?: number
  height?: number
  /** Optional mask (transparent = edit region) for inpainting. */
  mask?: Uint8Array
}

export interface ImageGenerator {
  generateHero(prompt: string, opts?: GenerateHeroOptions): Promise<HeroImage>
}

export interface ImageEditor {
  editImage(image: Uint8Array, opts: ImageEditOptions): Promise<HeroImage>
}

export type ImageGenStage = 'generate' | 'edit' | 'decode'

/** Typed error carrying the failing stage + whether a retry is worthwhile. */
export class ImageGenError extends Error {
  constructor(
    message: string,
    public readonly stage: ImageGenStage,
    public readonly status?: number,
    public readonly retryable: boolean = false,
  ) {
    super(message)
    this.name = 'ImageGenError'
  }
}
