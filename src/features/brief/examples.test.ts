import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { parseBrief, validateBrief } from './parse'
import { briefFromForm, briefToFormState } from './from-form'
import { EXAMPLES } from './examples'

// Guard: the inlined help-guide examples must stay identical to the canonical
// brief files in examples/. If someone edits one without the other, this fails.
const readExample = (name: string): unknown =>
  JSON.parse(readFileSync(path.join(process.cwd(), 'examples', name), 'utf8'))

describe('help-guide examples mirror the canonical example files', () => {
  it.each([
    ['summer-glow', 'brief.summer-glow.json'],
    ['morning-fuel', 'brief.morning-fuel.json'],
  ])('%s matches examples/%s', (slug, fileName) => {
    const parsed = validateBrief(readExample(fileName))
    expect(parsed.ok).toBe(true)
    const example = EXAMPLES.find((e) => e.slug === slug)
    expect(example).toBeDefined()
    expect(example?.brief).toEqual(parsed.brief)
  })

  // The help-guide "Load into the campaign form" prefill works by mapping a Brief
  // into form state; submitting must reproduce the exact same brief.
  it.each(EXAMPLES.map((e) => [e.slug, e] as const))(
    'prefill round-trips %s through the form',
    (_slug, example) => {
      const result = briefFromForm(briefToFormState(example.brief))
      expect(result.ok).toBe(true)
      expect(result.brief).toEqual(example.brief)
    },
  )
})

const EXAMPLES_DIR = path.join(process.cwd(), 'examples')
const briefFiles = readdirSync(EXAMPLES_DIR).filter((f) => /\.(json|ya?ml)$/.test(f))
const readBrief = (file: string) => parseBrief(readFileSync(path.join(EXAMPLES_DIR, file), 'utf8'))

// Directory-driven: any brief added to examples/ (used by the help tutorial, the
// seed script, and the CLI) must be a valid brief — no hand-maintained file list.
describe('every brief shipped in examples/ is valid', () => {
  it('finds brief files to check', () => {
    expect(briefFiles.length).toBeGreaterThan(0)
  })

  it.each(briefFiles)('%s parses to a valid brief', (file) => {
    const result = readBrief(file)
    expect(result.ok, result.errors?.join('; ')).toBe(true)
    expect(result.brief?.products.length ?? 0).toBeGreaterThanOrEqual(2)
  })
})

// JSON/YAML twins (brief.summer-glow.json + brief.summer-glow.yaml, etc.) must
// describe the same campaign. A JSON edit not mirrored in its YAML twin fails here,
// so the two formats can't silently drift.
describe('JSON and YAML twins describe the same brief', () => {
  const groups = new Map<string, string[]>()
  for (const file of briefFiles) {
    const base = file.replace(/\.(json|ya?ml)$/, '')
    groups.set(base, [...(groups.get(base) ?? []), file])
  }
  const pairs = [...groups.values()].filter((files) => files.length > 1)

  it('has at least one JSON/YAML pair to compare', () => {
    expect(pairs.length).toBeGreaterThan(0)
  })

  it.each(pairs.map((files) => ({ name: files.join(' = '), files })))('$name', ({ files }) => {
    const briefs = files.map((file) => {
      const result = readBrief(file)
      expect(result.ok, `${file}: ${result.errors?.join('; ')}`).toBe(true)
      return result.brief
    })
    for (const brief of briefs.slice(1)) {
      expect(brief).toEqual(briefs[0])
    }
  })
})
