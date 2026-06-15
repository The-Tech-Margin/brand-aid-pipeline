// Translation contract — kept vendor-neutral so the provider (dictionary, LLM,
// or a cloud API) can be swapped without touching the pipeline.

export interface TranslationResult {
  /** Translated text, or the original English on fallback. */
  text: string
  /** Locale actually applied ("en" when falling back). */
  locale: string
  translated: boolean
  provider: string
}

export interface Translator {
  translate(text: string, targetLocale: string): Promise<TranslationResult>
}
