import { describe, it, expect } from 'vitest'
import { briefSchema } from './schema'
import { BRIEF_FIELDS } from './field-registry'

// Guard: the field registry must describe exactly the schema's fields, with the
// same optionality. Add or change a brief field in the schema and forget the
// registry → this fails, so the form can't silently drift from the schema.
describe('brief field registry stays in sync with the schema', () => {
  const schemaKeys = Object.keys(briefSchema.shape).sort()

  it('registers exactly the schema fields (no missing, no extra)', () => {
    expect(BRIEF_FIELDS.map((f) => f.key).sort()).toEqual(schemaKeys)
  })

  it('required flags match schema optionality', () => {
    for (const def of BRIEF_FIELDS) {
      // A field is "optional" if the schema accepts `undefined` (optional or has a
      // default); required is the inverse.
      const acceptsUndefined = briefSchema.shape[def.key].safeParse(undefined).success
      expect(def.required).toBe(!acceptsUndefined)
    }
  })
})
