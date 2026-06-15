import { describe, it, expect } from 'vitest'
import { accessRequestSchema } from './schema'

function valid(overrides: Partial<Record<'name' | 'organization' | 'email', string>> = {}) {
  return {
    name: 'Ada Lovelace',
    organization: 'Analytical Co',
    email: 'ada@example.com',
    ...overrides,
  }
}

describe('accessRequestSchema', () => {
  it('accepts a well-formed request', () => {
    expect(accessRequestSchema.safeParse(valid()).success).toBe(true)
  })

  it('trims fields and lowercases the email', () => {
    const r = accessRequestSchema.parse(valid({ name: '  Ada  ', email: 'Ada@Example.COM ' }))
    expect(r.name).toBe('Ada')
    expect(r.email).toBe('ada@example.com')
  })

  it('rejects empty required fields', () => {
    expect(accessRequestSchema.safeParse(valid({ name: '   ' })).success).toBe(false)
    expect(accessRequestSchema.safeParse(valid({ organization: '' })).success).toBe(false)
  })

  it('rejects an invalid email', () => {
    expect(accessRequestSchema.safeParse(valid({ email: 'not-an-email' })).success).toBe(false)
  })

  it('enforces length caps', () => {
    expect(accessRequestSchema.safeParse(valid({ name: 'a'.repeat(81) })).success).toBe(false)
    expect(accessRequestSchema.safeParse(valid({ organization: 'a'.repeat(121) })).success).toBe(
      false,
    )
  })

  it('rejects control characters', () => {
    const withControl = valid({ name: `Ada${String.fromCharCode(7)}Lovelace` })
    expect(accessRequestSchema.safeParse(withControl).success).toBe(false)
  })
})
