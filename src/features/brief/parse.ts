// Parse + validate a campaign brief from pasted/uploaded JSON or YAML.
// Returns either a typed Brief or a flat list of human-readable error messages.
import { parse as parseYaml } from 'yaml'
import { briefSchema, type Brief } from './schema'

export type BriefFormat = 'json' | 'yaml' | 'auto'

export interface BriefParseResult {
  ok: boolean
  brief?: Brief
  errors?: string[]
}

/** Parse raw text into an object, trying JSON first then YAML when format is 'auto'. */
function toObject(text: string, format: BriefFormat): unknown {
  if (format === 'json') return JSON.parse(text)
  if (format === 'yaml') return parseYaml(text)
  try {
    return JSON.parse(text)
  } catch {
    return parseYaml(text)
  }
}

/** Validate an already-parsed value against the brief schema. */
export function validateBrief(raw: unknown): BriefParseResult {
  const result = briefSchema.safeParse(raw)
  if (!result.success) {
    return {
      ok: false,
      errors: result.error.issues.map((issue) => {
        const path = issue.path.join('.')
        return path ? `${path}: ${issue.message}` : issue.message
      }),
    }
  }
  return { ok: true, brief: result.data }
}

/** Parse + validate a brief from text. */
export function parseBrief(text: string, format: BriefFormat = 'auto'): BriefParseResult {
  let raw: unknown
  try {
    raw = toObject(text, format)
  } catch (error) {
    return { ok: false, errors: [`Could not parse brief: ${(error as Error).message}`] }
  }
  return validateBrief(raw)
}
