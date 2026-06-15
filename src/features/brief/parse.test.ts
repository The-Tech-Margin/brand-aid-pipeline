import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { parseBrief, validateBrief } from './parse'

const example = (file: string) => readFileSync(path.join(process.cwd(), 'examples', file), 'utf8')

function minimalBrief(overrides: Record<string, unknown> = {}) {
  return {
    campaign_name: 'Test',
    products: [
      { name: 'A', description: 'first' },
      { name: 'B', description: 'second' },
    ],
    target_region: 'Japan',
    target_audience: 'Everyone',
    campaign_message: 'Hello world',
    ...overrides,
  }
}

describe('parseBrief', () => {
  it('parses the JSON example brief', () => {
    const result = parseBrief(example('brief.summer-glow.json'), 'json')
    expect(result.ok).toBe(true)
    expect(result.brief?.products).toHaveLength(2)
    expect(result.brief?.aspect_ratios).toContain('1:1')
  })

  it('parses the YAML example brief', () => {
    const result = parseBrief(example('brief.summer-glow.yaml'), 'yaml')
    expect(result.ok).toBe(true)
    expect(result.brief?.locale).toBe('ja-JP')
  })

  it('auto-detects JSON vs YAML', () => {
    expect(parseBrief(example('brief.morning-fuel.json')).ok).toBe(true)
  })
})

describe('validateBrief', () => {
  it('accepts a single product with just a name (description optional)', () => {
    const result = validateBrief(minimalBrief({ products: [{ name: 'A' }] }))
    expect(result.ok).toBe(true)
    expect(result.brief?.products).toHaveLength(1)
  })

  it('rejects a brief with no products', () => {
    const result = validateBrief(minimalBrief({ products: [] }))
    expect(result.ok).toBe(false)
    expect(result.errors?.some((e) => e.includes('at least one product'))).toBe(true)
  })

  it('defaults the optional text fields when omitted', () => {
    const result = validateBrief({ products: [{ name: 'Solo' }] })
    expect(result.ok).toBe(true)
    expect(result.brief?.campaign_name).toBe('Untitled campaign')
    expect(result.brief?.target_region).toBe('Global')
    expect(result.brief?.target_audience).toBe('General audience')
    expect(result.brief?.campaign_message).toBe('')
  })

  it('defaults aspect_ratios when omitted', () => {
    const result = validateBrief(minimalBrief())
    expect(result.ok).toBe(true)
    expect(result.brief?.aspect_ratios).toEqual(['1:1', '9:16', '16:9'])
  })

  it('rejects invalid hex in brand_palette', () => {
    const result = validateBrief(minimalBrief({ brand_palette: ['not-a-color'] }))
    expect(result.ok).toBe(false)
  })
})
