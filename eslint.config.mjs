import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Full jsx-a11y recommended set — next/core-web-vitals ships only a 6-rule
  // subset. The plugin namespace is already registered by next, so we layer the
  // recommended rules on (rules only; no plugin re-registration).
  {
    files: ['**/*.{jsx,tsx}'],
    rules: { ...jsxA11y.flatConfigs.recommended.rules },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
