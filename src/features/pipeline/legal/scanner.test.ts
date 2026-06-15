import { describe, it, expect } from 'vitest'
import { scanText, scanBrief } from './scanner'
import type { LexiconRule } from './types'
import type { Brief } from '@/features/brief/schema'

const rules: LexiconRule[] = [
  { term: 'cure', match: 'word', severity: 'fail', reason: 'no medical cure claims' },
  { term: '100%', match: 'substring', severity: 'warn', reason: 'absolute claim' },
  { term: 'clinically proven', match: 'phrase', severity: 'warn', reason: 'needs evidence' },
]

describe('scanText', () => {
  it('flags whole-word matches case-insensitively', () => {
    const findings = scanText('This will CURE you', rules, 'msg')
    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({ term: 'cure', severity: 'fail', field: 'msg' })
  })

  it('does not flag a word rule inside a larger word', () => {
    const findings = scanText('book a manicure', rules, 'msg')
    expect(findings.find((f) => f.term === 'cure')).toBeUndefined()
  })

  it('flags substring and phrase rules', () => {
    const findings = scanText('100% clinically proven results', rules, 'msg')
    expect(findings.map((f) => f.term).sort()).toEqual(['100%', 'clinically proven'])
  })
})

describe('scanBrief', () => {
  it('summarizes counts and failure across message + products', () => {
    const brief = {
      campaign_message: 'A cure for everything',
      products: [{ name: '100% pure', description: 'safe', input_assets: [] }],
    } as unknown as Brief
    const result = scanBrief(brief, rules)
    expect(result.failed).toBe(true)
    expect(result.counts.fail).toBe(1)
    expect(result.counts.warn).toBe(1)
  })
})
