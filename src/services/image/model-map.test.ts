import { describe, it, expect } from 'vitest'
import { resolveModel, DEFAULT_IMAGE_MODEL, MODEL_MAP } from './model-map'
import { IMAGE_MODELS } from './types'

describe('resolveModel', () => {
  it('maps openai to gpt-image-1 with size-based sizing', () => {
    expect(resolveModel('openai')).toEqual({ modelId: 'openai/gpt-image-1', sizing: 'size' })
  })

  it('maps google to Imagen with aspect-ratio sizing', () => {
    const cfg = resolveModel('google')
    expect(cfg.modelId).toContain('imagen')
    expect(cfg.sizing).toBe('aspectRatio')
  })

  it('routes replicate/FLUX via the bfl gateway prefix with aspect-ratio sizing', () => {
    expect(resolveModel('replicate')).toEqual({ modelId: 'bfl/flux-2-pro', sizing: 'aspectRatio' })
  })

  it('defaults to openai and covers every dropdown option', () => {
    expect(DEFAULT_IMAGE_MODEL).toBe('openai')
    for (const id of IMAGE_MODELS) expect(MODEL_MAP[id]).toBeDefined()
  })
})
