// Pure helpers to turn a custom theme's tokens into CSS — used by the provider
// to inject a <style> block and by the compositor for creative brand framing.
import type { CustomTheme, ThemeTokens } from './constants'
import { TOKEN_TO_CSS_VAR } from './constants'

/** Serialize one mode's tokens into `--var: value;` declarations. */
export function tokensToDeclarations(tokens: ThemeTokens): string {
  return (Object.keys(TOKEN_TO_CSS_VAR) as (keyof ThemeTokens)[])
    .filter((key) => tokens[key] != null)
    .map((key) => `${TOKEN_TO_CSS_VAR[key]}: ${tokens[key]};`)
    .join(' ')
}

/** Build the scoped CSS that applies a custom theme for both light and dark modes. */
export function customThemeCss(theme: CustomTheme): string {
  return [
    `[data-theme="custom"][data-mode="light"] { ${tokensToDeclarations(theme.light)} }`,
    `[data-theme="custom"][data-mode="dark"] { ${tokensToDeclarations(theme.dark)} }`,
  ].join('\n')
}
