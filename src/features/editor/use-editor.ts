'use client'

// Side-effecting editor actions kept out of the canvas component: AI edits (via the
// gateway route) and save-back. Both report through the toast system; the AI call is
// abortable and cancelled on unmount.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/feedback/toast'
import type { AspectRatio } from '@/features/brief/schema'
import type { AiEditOp, EditorTarget } from './editor-types'

export interface EditorActions {
  busy: boolean
  /** Run an AI op on the current canvas image; resolves to a new data URL or null. */
  aiEdit: (currentDataUrl: string, op: AiEditOp, prompt?: string) => Promise<string | null>
  /** Generate a fresh background from a text prompt (no source asset needed); resolves
   *  to a data URL or null. Used by a from-scratch "New design". */
  generate: (prompt: string, ratio: AspectRatio) => Promise<string | null>
  /** Persist the exported design; resolves true on success. */
  save: (dataUrl: string) => Promise<boolean>
}

export function useEditorActions(target: EditorTarget): EditorActions {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => abortRef.current?.abort(), [])

  const aiEdit = useCallback(
    async (currentDataUrl: string, op: AiEditOp, prompt?: string): Promise<string | null> => {
      if (!target.assetId) {
        toast.error('Save the design first to use AI edits')
        return null
      }
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setBusy(true)
      try {
        const res = await fetch(`/api/creatives/${target.assetId}/ai-edit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: currentDataUrl, op, prompt }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          toast.error(data?.error ?? 'AI edit failed')
          return null
        }
        const { image } = (await res.json()) as { image: string }
        return image
      } catch (error) {
        if ((error as Error).name !== 'AbortError') toast.error('AI edit failed')
        return null
      } finally {
        setBusy(false)
      }
    },
    [target.assetId, toast],
  )

  const generate = useCallback(
    async (prompt: string, ratio: AspectRatio): Promise<string | null> => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setBusy(true)
      try {
        const res = await fetch(`/api/campaigns/${target.campaignId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, ratio }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null
          toast.error(data?.error ?? 'Generation failed')
          return null
        }
        const { image } = (await res.json()) as { image: string }
        return image
      } catch (error) {
        if ((error as Error).name !== 'AbortError') toast.error('Generation failed')
        return null
      } finally {
        setBusy(false)
      }
    },
    [target.campaignId, toast],
  )

  const save = useCallback(
    async (dataUrl: string): Promise<boolean> => {
      setBusy(true)
      try {
        const url = target.assetId
          ? `/api/creatives/${target.assetId}/edit`
          : `/api/campaigns/${target.campaignId}/edit`
        const body = target.assetId
          ? { image: dataUrl }
          : { image: dataUrl, productId: target.productId ?? undefined, ratio: target.ratio }
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          toast.error('Could not save the edited creative')
          return false
        }
        toast.success('Saved your edit')
        return true
      } catch {
        toast.error('Could not save the edited creative')
        return false
      } finally {
        setBusy(false)
      }
    },
    [target.assetId, target.campaignId, target.productId, target.ratio, toast],
  )

  return { busy, aiEdit, generate, save }
}
