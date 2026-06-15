// Loads the default prohibited-terms lexicon from config. Kept separate from the
// scanner so tests can pass their own rules without touching the real file.
import raw from '@/config/prohibited-terms.json'
import type { Lexicon, LexiconRule } from './types'

export const defaultLexicon = raw as unknown as Lexicon
export const defaultRules: LexiconRule[] = defaultLexicon.rules
