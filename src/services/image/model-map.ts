// Pure mapping from the dropdown's model id to the Vercel AI Gateway model string
// and its sizing convention. gpt-image-1 takes `size`; Imagen and FLUX take
// `aspectRatio`. "Replicate (FLUX)" routes via Black Forest Labs upstream (`bfl/`);
// true Replicate routing would need @ai-sdk/replicate + a token (out of scope).
import type { ImageModelId } from './types'

export interface GatewayModelConfig {
  modelId: string
  sizing: 'size' | 'aspectRatio'
}

export const MODEL_MAP: Record<ImageModelId, GatewayModelConfig> = {
  openai: { modelId: 'openai/gpt-image-1', sizing: 'size' },
  replicate: { modelId: 'bfl/flux-2-pro', sizing: 'aspectRatio' },
  google: { modelId: 'google/imagen-4.0-generate-001', sizing: 'aspectRatio' },
}

export const DEFAULT_IMAGE_MODEL: ImageModelId = 'openai'

export function resolveModel(id: ImageModelId): GatewayModelConfig {
  return MODEL_MAP[id]
}
