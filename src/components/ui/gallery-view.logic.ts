// Pure filter + sort for GalleryView — no React, so it unit-tests on its own.

export interface GallerySortOption<T> {
  key: string
  label: string
  compare: (a: T, b: T) => number
}

/** Filter by AND-matched search terms over each item's search text, then sort a copy
 *  with the given comparator (the input array is never mutated). Empty query = all. */
export function filterSortGallery<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
  compare?: (a: T, b: T) => number,
): T[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  const filtered = terms.length
    ? items.filter((item) => {
        const haystack = getSearchText(item).toLowerCase()
        return terms.every((term) => haystack.includes(term))
      })
    : items.slice()
  if (compare) filtered.sort(compare)
  return filtered
}
