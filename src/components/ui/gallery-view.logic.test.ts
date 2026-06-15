// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { filterSortGallery } from './gallery-view.logic'

interface Row {
  name: string
  size: number
}

function rows(): Row[] {
  return [
    { name: 'Banana split', size: 30 },
    { name: 'Apple pie', size: 10 },
    { name: 'Cherry tart', size: 20 },
  ]
}

const byName = (a: Row, b: Row) => a.name.localeCompare(b.name)
const bySizeDesc = (a: Row, b: Row) => b.size - a.size

describe('filterSortGallery', () => {
  it('returns all items (sorted) for an empty query', () => {
    expect(filterSortGallery(rows(), '   ', (r) => r.name, byName).map((r) => r.name)).toEqual([
      'Apple pie',
      'Banana split',
      'Cherry tart',
    ])
  })

  it('filters case-insensitively by the search text', () => {
    expect(filterSortGallery(rows(), 'APPLE', (r) => r.name).map((r) => r.name)).toEqual([
      'Apple pie',
    ])
  })

  it('requires every term to match (AND semantics)', () => {
    expect(filterSortGallery(rows(), 'cherry tart', (r) => r.name).map((r) => r.name)).toEqual([
      'Cherry tart',
    ])
    expect(filterSortGallery(rows(), 'cherry pie', (r) => r.name)).toHaveLength(0)
  })

  it('sorts with the comparator and never mutates the input', () => {
    const input = rows()
    const out = filterSortGallery(input, '', (r) => r.name, bySizeDesc)
    expect(out.map((r) => r.size)).toEqual([30, 20, 10])
    expect(input.map((r) => r.name)).toEqual(['Banana split', 'Apple pie', 'Cherry tart'])
  })
})
