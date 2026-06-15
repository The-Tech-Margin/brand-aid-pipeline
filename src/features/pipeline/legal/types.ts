// Types for the legal-content scanner and its configurable lexicon.

export type Severity = 'fail' | 'warn' | 'info'
export type MatchType = 'word' | 'phrase' | 'substring'

/** One configurable rule from config/prohibited-terms.json. */
export interface LexiconRule {
  term: string
  match: MatchType
  severity: Severity
  category?: string
  reason: string
}

export interface Lexicon {
  version: string
  locale_scope?: string
  rules: LexiconRule[]
}

/** A single flagged occurrence in a piece of copy. */
export interface LegalFinding {
  term: string
  severity: Severity
  category?: string
  reason: string
  /** Which field was scanned, e.g. "campaign_message" or "products[0].description". */
  field: string
  /** Character offset of the match within that field's text. */
  index: number
}

export interface LegalScanResult {
  findings: LegalFinding[]
  /** True when any finding has severity "fail". */
  failed: boolean
  counts: Record<Severity, number>
}
