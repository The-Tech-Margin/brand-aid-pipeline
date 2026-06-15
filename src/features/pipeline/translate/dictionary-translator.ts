// Seeded dictionary translator for the example locales. Returns the English
// source unchanged when a phrase or locale isn't covered (graceful fallback).
import type { Translator, TranslationResult } from './types'

/** Seed translations for the bundled example campaign messages. */
export const SEED_DICTIONARY: Record<string, Record<string, string>> = {
  'ja-JP': {
    'Glow that lasts all day': '一日中続く輝き',
  },
  'de-DE': {
    'Your best morning, on repeat': 'Dein bester Morgen, immer wieder',
  },
}

export class DictionaryTranslator implements Translator {
  constructor(
    private readonly dictionary: Record<string, Record<string, string>> = SEED_DICTIONARY,
  ) {}

  async translate(text: string, targetLocale: string): Promise<TranslationResult> {
    const hit = this.dictionary[targetLocale]?.[text]
    if (hit) {
      return { text: hit, locale: targetLocale, translated: true, provider: 'dictionary' }
    }
    return { text, locale: 'en', translated: false, provider: 'dictionary' }
  }
}

/** Translate but never throw — any provider error falls back to English. */
export async function safeTranslate(
  translator: Translator,
  text: string,
  targetLocale: string | undefined,
): Promise<TranslationResult> {
  if (!targetLocale || targetLocale.startsWith('en')) {
    return { text, locale: 'en', translated: false, provider: 'none' }
  }
  try {
    return await translator.translate(text, targetLocale)
  } catch {
    return { text, locale: 'en', translated: false, provider: 'fallback' }
  }
}
