import { describe, it, expect } from 'vitest'
import { formatShortDateTime, formatDateTime } from './format'

describe('formatShortDateTime — compact UTC for dense tables', () => {
  it('renders "Mon D, HH:MM" in UTC with no year/seconds/suffix', () => {
    expect(formatShortDateTime('2026-06-15T14:45:09Z')).toBe('Jun 15, 14:45')
  })

  it('zero-pads hours and minutes', () => {
    expect(formatShortDateTime('2026-01-03T04:05:00Z')).toBe('Jan 3, 04:05')
  })

  it('is shorter than the full timestamp it pairs with', () => {
    const iso = '2026-12-31T23:59:00Z'
    expect(formatShortDateTime(iso).length).toBeLessThan(formatDateTime(iso).length)
  })
})
