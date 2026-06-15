// Legal-content scanner — flags prohibited/risky terms in campaign copy.
// Pure functions over (text, rules) so they unit-test without any I/O.
import type { Brief } from '@/features/brief/schema'
import type { LegalFinding, LegalScanResult, LexiconRule, MatchType, Severity } from './types'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Build the matcher for a term given its match mode. */
function matcher(term: string, mode: MatchType): RegExp {
  const escaped = escapeRegExp(term)
  if (mode === 'substring') return new RegExp(escaped, 'gi')
  // word + phrase both anchor on word boundaries so partial words don't match.
  return new RegExp(`\\b${escaped}\\b`, 'gi')
}

/** Return every match offset for a rule within a single string. */
export function findOccurrences(text: string, rule: LexiconRule): number[] {
  const regex = matcher(rule.term, rule.match)
  const offsets: number[] = []
  for (const match of text.matchAll(regex)) {
    if (match.index !== undefined) offsets.push(match.index)
  }
  return offsets
}

/** Scan one field of text against all rules. */
export function scanText(text: string, rules: LexiconRule[], field: string): LegalFinding[] {
  const findings: LegalFinding[] = []
  for (const rule of rules) {
    for (const index of findOccurrences(text, rule)) {
      findings.push({
        term: rule.term,
        severity: rule.severity,
        category: rule.category,
        reason: rule.reason,
        field,
        index,
      })
    }
  }
  return findings
}

function summarize(findings: LegalFinding[]): LegalScanResult {
  const counts: Record<Severity, number> = { fail: 0, warn: 0, info: 0 }
  for (const finding of findings) counts[finding.severity] += 1
  return { findings, failed: counts.fail > 0, counts }
}

/** Scan an arbitrary set of named fields (used for generated copy too). */
export function scanFields(
  fields: { field: string; text: string }[],
  rules: LexiconRule[],
): LegalScanResult {
  const findings = fields.flatMap(({ field, text }) => scanText(text, rules, field))
  return summarize(findings)
}

/** Scan a campaign brief's message and product copy. */
export function scanBrief(brief: Brief, rules: LexiconRule[]): LegalScanResult {
  const fields = [
    { field: 'campaign_message', text: brief.campaign_message },
    ...brief.products.flatMap((product, i) => [
      { field: `products[${i}].name`, text: product.name },
      { field: `products[${i}].description`, text: product.description },
    ]),
  ]
  return scanFields(fields, rules)
}
