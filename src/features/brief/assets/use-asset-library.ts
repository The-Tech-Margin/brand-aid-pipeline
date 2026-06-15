'use client'

// Loads the member's input-asset library (uploads + shared seeds) once for the brief
// form, and exposes a refresh so a new upload shows up across every product picker.
// Refresh just bumps a key; the fetch + state writes live inside the effect's async
// path (after the await), never synchronously in the effect body.
import { useCallback, useEffect, useState } from 'react'

export interface AssetItem {
  name: string
  url: string | null
  createdAt: string | null
  size: number | null
}

export function useAssetLibrary() {
  const [library, setLibrary] = useState<AssetItem[]>([])
  const [loading, setLoading] = useState(true)
  const [reloadKey, setReloadKey] = useState(0)

  const refresh = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        const res = await fetch('/api/assets')
        if (!res.ok) return
        const data = (await res.json()) as { assets?: AssetItem[] }
        if (active) setLibrary(Array.isArray(data.assets) ? data.assets : [])
      } catch {
        // Library is an enhancement — a failed fetch just leaves it empty.
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [reloadKey])

  return { library, loading, refresh }
}
