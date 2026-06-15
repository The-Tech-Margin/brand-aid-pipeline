'use client'

// Konva brand editor — loads a creative onto a canvas, lets the user add on-brand
// text + the logo, move/resize/rotate/delete, run AI ops (remove background,
// generative replace) via the gateway, and export the result back as a new creative
// variant. Client-only (Konva touches window/canvas); loaded with ssr:false.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Text as KonvaText,
  Rect,
  Transformer,
} from 'react-konva'
import type Konva from 'konva'
import { EditorToolbar } from './editor-toolbar'
import { useEditorActions } from './use-editor'
import { canvasSizeForRatio, fitScale, defaultTextColor } from './scene'
import type { AiEditOp, CampaignBrandKit, EditorTarget } from './editor-types'

const EDITOR_FONT_FAMILY = 'PoppinsEditor'
const EDITOR_FONT_URL = '/fonts/Poppins-Bold.ttf'
const MAX_DISPLAY = 520
const NUDGE = 1
const NUDGE_LARGE = 10

type NodeKind = 'bg' | 'text' | 'image'

interface EditorNode {
  id: string
  kind: NodeKind
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  src?: string
  width?: number
  height?: number
  text?: string
  fill?: string
  fontSize?: number
}

export interface BrandEditorProps {
  target: EditorTarget
  brandKit: CampaignBrandKit
  onClose: () => void
}

export function BrandEditor({ target, brandKit, onClose }: BrandEditorProps) {
  const router = useRouter()
  const actions = useEditorActions(target)
  const canvas = useMemo(() => canvasSizeForRatio(target.ratio), [target.ratio])
  // Clamp the on-screen canvas to the viewport so the editor never overflows on a
  // phone. Lazy init reads window directly (component is client-only, ssr:false).
  const [maxDisplay, setMaxDisplay] = useState(() =>
    typeof window === 'undefined'
      ? MAX_DISPLAY
      : Math.max(240, Math.min(MAX_DISPLAY, window.innerWidth - 64)),
  )
  useEffect(() => {
    const update = () => setMaxDisplay(Math.max(240, Math.min(MAX_DISPLAY, window.innerWidth - 64)))
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  const scale = fitScale(canvas, maxDisplay, maxDisplay)

  const [nodes, setNodes] = useState<EditorNode[]>(() =>
    target.imageUrl
      ? [
          {
            id: 'n0',
            kind: 'bg',
            src: target.imageUrl,
            x: 0,
            y: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            width: canvas.width,
            height: canvas.height,
          },
        ]
      : [],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [images, setImages] = useState<Record<string, HTMLImageElement>>({})
  const [fontReady, setFontReady] = useState(false)

  const stageRef = useRef<Konva.Stage>(null)
  const trRef = useRef<Konva.Transformer>(null)
  const objectUrls = useRef<string[]>([])
  const idCounter = useRef(1)
  const nextId = () => `n${idCounter.current++}`

  const bgNode = nodes.find((n) => n.kind === 'bg')
  const placedCount = nodes.filter((n) => n.kind !== 'bg').length

  // Load the brand font so Konva text renders in Poppins, not a fallback serif.
  useEffect(() => {
    let cancelled = false
    const face = new FontFace(EDITOR_FONT_FAMILY, `url(${EDITOR_FONT_URL})`)
    face
      .load()
      .then((loaded) => {
        if (cancelled) return
        document.fonts.add(loaded)
        setFontReady(true)
      })
      .catch(() => setFontReady(true))
    return () => {
      cancelled = true
    }
  }, [])

  // Load any referenced image src not yet in the cache. http(s) URLs go through a
  // blob/object URL so the export canvas isn't tainted (cross-origin).
  useEffect(() => {
    const needed = nodes.map((n) => n.src).filter((s): s is string => !!s && !images[s])
    if (needed.length === 0) return
    let cancelled = false
    needed.forEach(async (src) => {
      try {
        let url = src
        if (/^https?:/.test(src)) {
          const blob = await (await fetch(src)).blob()
          url = URL.createObjectURL(blob)
          objectUrls.current.push(url)
        }
        const img = new window.Image()
        img.onload = () => {
          if (!cancelled) setImages((prev) => ({ ...prev, [src]: img }))
        }
        img.src = url
      } catch {
        // ignore — node simply won't render until a valid src loads
      }
    })
    return () => {
      cancelled = true
    }
  }, [nodes, images])

  // Revoke object URLs on unmount.
  useEffect(() => {
    const urls = objectUrls.current
    return () => urls.forEach(URL.revokeObjectURL)
  }, [])

  // Attach the transformer to the selected node.
  useEffect(() => {
    const tr = trRef.current
    const stage = stageRef.current
    if (!tr || !stage) return
    const node = selectedId ? stage.findOne(`#${selectedId}`) : null
    tr.nodes(node ? [node] : [])
    tr.getLayer()?.batchDraw()
  }, [selectedId, nodes, images])

  const updateNode = useCallback((id: string, patch: Partial<EditorNode>) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, ...patch } : n)))
  }, [])

  const addText = useCallback(
    (text: string) => {
      const id = nextId()
      setNodes((prev) => [
        ...prev,
        {
          id,
          kind: 'text',
          text,
          x: Math.round(canvas.width * 0.1),
          y: Math.round(canvas.height * 0.72),
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          fill: defaultTextColor(brandKit.palette),
          fontSize: Math.round(canvas.width * 0.07),
          width: Math.round(canvas.width * 0.8),
        },
      ])
      setSelectedId(id)
    },
    [canvas.width, canvas.height, brandKit.palette],
  )

  const addLogo = useCallback(() => {
    const id = nextId()
    const size = Math.round(canvas.width * 0.18)
    setNodes((prev) => [
      ...prev,
      {
        id,
        kind: 'image',
        src: brandKit.logoUrl,
        x: Math.round(canvas.width * 0.06),
        y: Math.round(canvas.height * 0.06),
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: size,
        height: size,
      },
    ])
    setSelectedId(id)
  }, [canvas.width, canvas.height, brandKit.logoUrl])

  const editText = useCallback(
    (id: string) => {
      const node = nodes.find((n) => n.id === id)
      const next = window.prompt('Edit text', node?.text ?? '')
      if (next != null) updateNode(id, { text: next })
    },
    [nodes, updateNode],
  )

  const setFill = useCallback(
    (color: string) => {
      if (selectedId) updateNode(selectedId, { fill: color })
    },
    [selectedId, updateNode],
  )

  const deleteSelected = useCallback(() => {
    if (!selectedId) return
    setNodes((prev) => prev.filter((n) => n.id !== selectedId))
    setSelectedId(null)
  }, [selectedId])

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setSelectedId((cur) => (cur === id ? null : cur))
  }, [])

  // Keyboard handle for a placed element (text/logo): arrows nudge (Shift = larger),
  // Delete removes, Enter edits text — so the canvas is operable without a mouse.
  const onElementKey = useCallback(
    (e: React.KeyboardEvent, id: string) => {
      const node = nodes.find((n) => n.id === id)
      if (!node) return
      const step = e.shiftKey ? NUDGE_LARGE : NUDGE
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          setSelectedId(id)
          updateNode(id, { x: node.x - step })
          break
        case 'ArrowRight':
          e.preventDefault()
          setSelectedId(id)
          updateNode(id, { x: node.x + step })
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedId(id)
          updateNode(id, { y: node.y - step })
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedId(id)
          updateNode(id, { y: node.y + step })
          break
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          deleteNode(id)
          break
        case 'Enter':
          if (node.kind === 'text') {
            e.preventDefault()
            editText(id)
          }
          break
      }
    },
    [nodes, updateNode, deleteNode, editText],
  )

  // Render the background image alone to a clean PNG for the AI op input.
  const exportBgDataUrl = useCallback((): string | null => {
    if (!bgNode?.src) return null
    const img = images[bgNode.src]
    if (!img) return null
    const c = document.createElement('canvas')
    c.width = img.naturalWidth || canvas.width
    c.height = img.naturalHeight || canvas.height
    const ctx = c.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/png')
  }, [bgNode, images, canvas.width, canvas.height])

  const runAi = useCallback(
    async (op: AiEditOp, prompt?: string) => {
      const src = exportBgDataUrl()
      if (!src || !bgNode) return
      const result = await actions.aiEdit(src, op, prompt)
      if (result) updateNode(bgNode.id, { src: result })
    },
    [exportBgDataUrl, bgNode, actions, updateNode],
  )

  // From-scratch generation for a new design (no source asset): create/replace the
  // background from a text prompt, behind any text/logo already added.
  const runGenerate = useCallback(
    async (prompt: string) => {
      const result = await actions.generate(prompt, target.ratio)
      if (!result) return
      const id = nextId()
      setNodes((prev) => [
        {
          id,
          kind: 'bg',
          src: result,
          x: 0,
          y: 0,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          width: canvas.width,
          height: canvas.height,
        },
        ...prev.filter((n) => n.kind !== 'bg'),
      ])
      setSelectedId(null)
    },
    [actions, target.ratio, canvas.width, canvas.height],
  )

  const onGenerative = useCallback(() => {
    // Editing an existing creative refines its image (img2img); a new design generates
    // a fresh background from scratch.
    const editing = !!bgNode && !!target.assetId
    const prompt = window.prompt(
      editing
        ? 'Describe the change (e.g. "make the background a sunset")'
        : 'Describe the image to generate (e.g. "a serum bottle on sunlit marble, soft shadows")',
    )
    const text = prompt?.trim()
    if (!text) return
    if (editing) void runAi('generative', text)
    else void runGenerate(text)
  }, [bgNode, target.assetId, runAi, runGenerate])

  const onSave = useCallback(async () => {
    const stage = stageRef.current
    if (!stage) return
    setSelectedId(null)
    // Let the transformer detach before exporting so its handles aren't captured.
    await new Promise((r) => setTimeout(r, 30))
    const dataUrl = stage.toDataURL({ pixelRatio: 1 / scale, mimeType: 'image/png' })
    const ok = await actions.save(dataUrl)
    if (ok) {
      onClose()
      router.refresh()
    }
  }, [scale, actions, onClose, router])

  const handleStageMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null)
  }, [])

  function renderNode(node: EditorNode) {
    const handlers = {
      id: node.id,
      x: node.x,
      y: node.y,
      rotation: node.rotation,
      scaleX: node.scaleX,
      scaleY: node.scaleY,
      draggable: true,
      onClick: () => setSelectedId(node.id),
      onTap: () => setSelectedId(node.id),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) =>
        updateNode(node.id, { x: e.target.x(), y: e.target.y() }),
      onTransformEnd: (e: Konva.KonvaEventObject<Event>) =>
        updateNode(node.id, {
          x: e.target.x(),
          y: e.target.y(),
          rotation: e.target.rotation(),
          scaleX: e.target.scaleX(),
          scaleY: e.target.scaleY(),
        }),
    }

    if (node.kind === 'text') {
      return (
        <KonvaText
          key={node.id}
          {...handlers}
          text={node.text}
          fill={node.fill}
          fontFamily={EDITOR_FONT_FAMILY}
          fontSize={node.fontSize}
          width={node.width}
          onDblClick={() => editText(node.id)}
          onDblTap={() => editText(node.id)}
        />
      )
    }

    const img = node.src ? images[node.src] : undefined
    if (!img) return null
    return (
      <KonvaImage
        key={node.id}
        {...handlers}
        image={img}
        width={node.kind === 'bg' ? canvas.width : node.width}
        height={node.kind === 'bg' ? canvas.height : node.height}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <EditorToolbar
        palette={brandKit.palette}
        busy={actions.busy}
        hasSelection={!!selectedId}
        canGenerate
        canEditImage={!!target.assetId && !!bgNode}
        onAddText={addText}
        onAddLogo={addLogo}
        onSetFill={setFill}
        onDeleteSelected={deleteSelected}
        onRemoveBg={() => void runAi('remove-bg')}
        onGenerative={onGenerative}
        onSave={onSave}
      />

      {nodes.some((n) => n.kind !== 'bg') && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Elements">
          <span className="text-muted-foreground text-xs">Elements:</span>
          {nodes
            .filter((n) => n.kind !== 'bg')
            .map((n) => (
              <button
                key={n.id}
                type="button"
                aria-pressed={selectedId === n.id}
                onClick={() => setSelectedId(n.id)}
                onKeyDown={(e) => onElementKey(e, n.id)}
                title="Arrow keys move · Shift+Arrow moves further · Delete removes · Enter edits text"
                className={`border-border border px-2 py-0.5 text-xs focus-visible:ring-2 focus-visible:ring-offset-1 ${selectedId === n.id ? 'bg-muted' : ''}`}
                style={{ borderRadius: 'var(--radius)' }}
              >
                {n.kind === 'text' ? `“${(n.text ?? '').slice(0, 18) || 'Text'}”` : 'Logo'}
              </button>
            ))}
          <span className="text-muted-foreground text-xs">
            — select, then arrows move · Delete removes · Enter edits
          </span>
        </div>
      )}

      <p id="editor-canvas-summary" className="sr-only">
        {bgNode ? 'Has a background image. ' : 'Blank background. '}
        {placedCount === 0
          ? 'No elements added yet.'
          : `${placedCount} element${placedCount === 1 ? '' : 's'} placed.`}{' '}
        Use the Elements row above to select and move them by keyboard.
      </p>
      <div role="status" aria-live="polite" className="sr-only">
        {actions.busy ? 'Working on your design…' : ''}
      </div>

      <div
        role="group"
        aria-label="Design canvas"
        aria-describedby="editor-canvas-summary"
        aria-busy={actions.busy}
        className="border-border bg-muted/30 mx-auto max-w-full border"
        style={{ width: canvas.width * scale, height: canvas.height * scale }}
      >
        {fontReady && (
          <Stage
            ref={stageRef}
            width={canvas.width * scale}
            height={canvas.height * scale}
            scaleX={scale}
            scaleY={scale}
            onMouseDown={handleStageMouseDown}
            onTouchStart={handleStageMouseDown}
          >
            <Layer>
              {!bgNode && (
                <Rect
                  x={0}
                  y={0}
                  width={canvas.width}
                  height={canvas.height}
                  fill="#ffffff"
                  listening={false}
                />
              )}
              {nodes.map(renderNode)}
              <Transformer ref={trRef} rotateEnabled keepRatio={false} />
            </Layer>
          </Stage>
        )}
      </div>

      {!target.assetId && (
        <p className="text-muted-foreground text-xs">
          New design: <strong className="text-foreground">Generate</strong> a background from a
          prompt, add text and your logo, then <strong className="text-foreground">Save</strong>.
          Background removal becomes available once the creative is saved.
        </p>
      )}
    </div>
  )
}
