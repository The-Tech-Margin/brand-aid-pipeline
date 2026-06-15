// Test setup — jest-dom matchers + jest-axe a11y assertions for Vitest.
import '@testing-library/jest-dom/vitest'
import { expect } from 'vitest'
import { toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)
