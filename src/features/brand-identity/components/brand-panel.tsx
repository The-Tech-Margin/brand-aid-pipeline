'use client'

// Brand identity editor (in the design studio): set your business name + logo, with a
// live preview of the app wordmark. Admins can publish their brand as the org-wide
// default. Logos upload to POST /api/assets?scope=logo; the action stores the path.
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/feedback/toast'
import { ImageIcon, PlusIcon, SpinnerIcon, TrashIcon } from '@/components/icons'
import {
  saveBrandAction,
  publishGlobalBrandAction,
  clearGlobalBrandAction,
} from '@/features/brand-identity/actions'
import type { Brand } from '@/features/brand-identity/constants'
import {
  POPULAR_DISPLAY_FONTS,
  googleFontsHref,
  sanitizeFontFamily,
} from '@/features/brand-identity/fonts'

interface BrandPanelProps {
  initialBusinessName: string
  initialLogoUrl: string | null
  initialDisplayFont: string
  global: Brand | null
  isAdmin: boolean
  defaultBrand: Brand
}

export function BrandPanel({
  initialBusinessName,
  initialLogoUrl,
  initialDisplayFont,
  global,
  isAdmin,
  defaultBrand,
}: BrandPanelProps) {
  const router = useRouter()
  const toast = useToast()
  const [businessName, setBusinessName] = useState(initialBusinessName)
  const [displayFont, setDisplayFont] = useState(initialDisplayFont)
  const [logoUrl, setLogoUrl] = useState<string | null>(initialLogoUrl)
  const [logoFilename, setLogoFilename] = useState<string | undefined>(undefined)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const objectUrl = useRef<string | null>(null)

  // The font that drives the live preview wordmark — what the member typed, else the
  // org default, else the built-in decorative font.
  const previewFont = sanitizeFontFamily(displayFont) || global?.displayFont || null

  useEffect(
    () => () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    },
    [],
  )

  // Load the chosen Google Font into the studio so the preview renders it live.
  useEffect(() => {
    if (!previewFont) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = googleFontsHref(previewFont)
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [previewFont])

  async function uploadLogo(file: File) {
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('scope', 'logo')
      const res = await fetch('/api/assets', { method: 'POST', body })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Upload failed')
        return
      }
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = URL.createObjectURL(file)
      setLogoUrl(objectUrl.current)
      setLogoFilename(data.name)
      setRemoveLogo(false)
    } catch {
      toast.error('Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function clearLogo() {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current)
      objectUrl.current = null
    }
    setLogoUrl(null)
    setLogoFilename(undefined)
    setRemoveLogo(true)
  }

  async function persist(): Promise<boolean> {
    const res = await saveBrandAction({ businessName, logoFilename, removeLogo, displayFont })
    if (!res.ok) {
      toast.error(res.error)
      return false
    }
    return true
  }

  async function save() {
    setBusy(true)
    const ok = await persist()
    setBusy(false)
    if (ok) {
      toast.success('Brand saved')
      router.refresh()
    }
  }

  async function publishGlobal() {
    setBusy(true)
    if (!(await persist())) {
      setBusy(false)
      return
    }
    const res = await publishGlobalBrandAction()
    setBusy(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Published as the global default brand')
    router.refresh()
  }

  async function clearGlobal() {
    setBusy(true)
    const res = await clearGlobalBrandAction()
    setBusy(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    toast.success('Global default brand cleared')
    router.refresh()
  }

  const previewLogo = logoUrl ?? global?.logoUrl ?? defaultBrand.logoUrl
  const previewName = businessName.trim() || global?.businessName || defaultBrand.businessName

  return (
    <section
      className="border-border bg-card flex flex-col gap-5 border p-4"
      style={{ borderRadius: 'var(--radius)' }}
      aria-label="Brand identity"
    >
      <div>
        <h2 className="text-xl leading-[1.4] font-semibold">Brand</h2>
        <p className="text-muted-foreground text-sm">
          Your business name and logo appear in the app chrome. Leave a field blank to fall back to
          the {global ? 'organization’s' : 'app'} default.
        </p>
      </div>

      <div
        className="border-border flex items-center gap-3 border p-3"
        style={{ borderRadius: 'var(--radius)' }}
      >
        {previewLogo ? (
          <Image
            src={previewLogo}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 object-contain"
          />
        ) : (
          <ImageIcon className="text-muted-foreground h-8 w-8" aria-hidden="true" />
        )}
        <span
          className="gradient-text text-2xl"
          style={{ fontFamily: previewFont ? `'${previewFont}', cursive` : 'var(--font-display)' }}
        >
          {previewName}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="business-name" className="text-sm font-medium">
          Business name
        </label>
        <Input
          id="business-name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          maxLength={60}
          placeholder={global?.businessName ?? defaultBrand.businessName}
          className="max-w-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="display-font" className="text-sm font-medium">
          Decorative font
        </label>
        <Input
          id="display-font"
          value={displayFont}
          onChange={(e) => setDisplayFont(e.target.value)}
          maxLength={50}
          list="bh-font-suggestions"
          placeholder={global?.displayFont ?? 'Pacifico'}
          className="max-w-sm"
          aria-describedby="display-font-hint"
        />
        <datalist id="bh-font-suggestions">
          {POPULAR_DISPLAY_FONTS.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
        <p id="display-font-hint" className="text-muted-foreground text-xs">
          Any{' '}
          <a
            href="https://fonts.google.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-brand-cyan underline"
          >
            Google Fonts
          </a>{' '}
          family — drives the header, footer, and hero wordmark.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Logo</span>
        <div className="flex flex-wrap items-center gap-3">
          <span
            className="border-border bg-muted relative flex h-12 w-12 items-center justify-center overflow-hidden border"
            style={{ borderRadius: 'var(--radius)' }}
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="Your logo"
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 object-contain"
              />
            ) : (
              <ImageIcon className="text-muted-foreground h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <SpinnerIcon className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <PlusIcon className="h-4 w-4" aria-hidden="true" />
            )}
            {logoUrl ? 'Replace logo' : 'Upload logo'}
          </Button>
          {logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearLogo}
              aria-label="Remove logo"
            >
              <TrashIcon className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void uploadLogo(f)
            }}
          />
        </div>
      </div>

      <div className="border-border flex flex-wrap items-center gap-2 border-t pt-4">
        <Button onClick={save} disabled={busy || uploading}>
          Save brand
        </Button>
        {isAdmin && (
          <Button variant="secondary" onClick={publishGlobal} disabled={busy || uploading}>
            Publish as global default
          </Button>
        )}
        {isAdmin && global && (
          <Button variant="ghost" onClick={clearGlobal} disabled={busy}>
            Clear global default
          </Button>
        )}
      </div>

      {global && (
        <p className="text-muted-foreground text-xs">
          Organization default: <strong className="text-foreground">{global.businessName}</strong>
          {isAdmin ? ' — members without their own brand see this.' : ''}
        </p>
      )}
    </section>
  )
}
