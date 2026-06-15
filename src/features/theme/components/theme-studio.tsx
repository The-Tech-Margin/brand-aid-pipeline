'use client'

// Theme studio — the in-app theme creation tool. Pick a preset, fork it into an
// editable draft, tune each token with a live preview (driven through the shared
// ThemeProvider), and save it as your own. Admins can additionally publish a theme
// as the app-wide global default. Fully keyboard operable; every control is labelled.
import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/components/theme/theme-provider'
import { useToast } from '@/components/feedback/toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckIcon, DownloadIcon, PlusIcon, TrashIcon } from '@/components/icons'
import type { CustomTheme, Mode, ThemeName, ThemeTokens } from '@/components/theme/constants'
import { Badge, type BadgeTone } from '@/components/ui/badge'
import { tokenContrastPairs, worstLevel, type WcagLevel } from '@/components/theme/contrast'
import { themeFileSchema } from '@/components/theme/schema'
import { draftFromPreset } from '@/components/theme/presets'
import { slugify } from '@/lib/slug'
import {
  saveThemeAction,
  deleteThemeAction,
  setGlobalThemeAction,
  clearGlobalThemeAction,
} from '@/features/theme/actions'

const PREVIEW_ID = 'studio-preview'

const TOKEN_GROUPS: { legend: string; fields: { key: keyof ThemeTokens; label: string }[] }[] = [
  {
    legend: 'Surfaces',
    fields: [
      { key: 'background', label: 'Background' },
      { key: 'card', label: 'Card' },
      { key: 'muted', label: 'Muted' },
      { key: 'border', label: 'Border' },
    ],
  },
  {
    legend: 'Text',
    fields: [
      { key: 'foreground', label: 'Foreground' },
      { key: 'mutedForeground', label: 'Muted text' },
    ],
  },
  {
    legend: 'Brand & accents',
    fields: [
      { key: 'primary', label: 'Primary' },
      { key: 'primaryForeground', label: 'Primary text' },
      { key: 'brandPink', label: 'Pink' },
      { key: 'brandLime', label: 'Lime' },
      { key: 'brandCyan', label: 'Cyan' },
      { key: 'brandHotRed', label: 'Hot red' },
      { key: 'brandGoldenrod', label: 'Goldenrod' },
    ],
  },
  {
    legend: 'Secondary & tertiary',
    fields: [
      { key: 'secondary', label: 'Secondary' },
      { key: 'secondaryForeground', label: 'Secondary text' },
      { key: 'tertiary', label: 'Tertiary' },
      { key: 'tertiaryForeground', label: 'Tertiary text' },
    ],
  },
]
const RADIUS_OPTIONS = ['0', '0.2rem', '2px', '4px', '0.4rem', '8px', '12px', '16px']
const SWATCH_KEYS: (keyof ThemeTokens)[] = ['primary', 'brandCyan', 'brandLime', 'brandHotRed']

function dedupe(themes: CustomTheme[]): CustomTheme[] {
  const seen = new Set<string>()
  return themes.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
}

/** Coerce any stored value into the 6-digit hex the native color swatch needs. */
function toSwatch(value: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#000000'
}

/** Download a theme as a strictly-shaped JSON file (name + both token sets). */
function exportTheme(theme: CustomTheme) {
  const file = { name: theme.name, light: theme.light, dark: theme.dark }
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${slugify(theme.name) || 'theme'}.theme.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

interface ThemeStudioProps {
  presets: CustomTheme[]
  userThemes: CustomTheme[]
  globalTheme: CustomTheme | null
  isAdmin: boolean
}

export function ThemeStudio({ presets, userThemes, globalTheme, isAdmin }: ThemeStudioProps) {
  const { mode, setMode, theme, activeCustom, setTheme, setCustomThemes, applyCustom } = useTheme()
  const toast = useToast()
  const router = useRouter()

  const [myThemes, setMyThemes] = useState<CustomTheme[]>(userThemes)
  const [global, setGlobal] = useState<CustomTheme | null>(globalTheme)
  const [draft, setDraft] = useState<CustomTheme | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  const base = useMemo(
    () => dedupe([...(global ? [global] : []), ...myThemes, ...presets]),
    [global, myThemes, presets],
  )

  const activeId = theme === 'custom' ? activeCustom?.id : undefined

  // The theme/active-id that was applied *before* an edit began. preview() swaps the
  // active theme to the transient PREVIEW_ID, so cancel must restore from here, not
  // from the (now-preview) live state.
  const preEditTheme = useRef<ThemeName>(theme)
  const preEditActiveId = useRef<string | undefined>(activeId)

  function applyExisting(id: string) {
    setDraft(null)
    setCustomThemes(base)
    setTheme('custom')
    applyCustom(id)
  }

  function applyBuiltin(name: 'branded' | 'plain') {
    setDraft(null)
    setCustomThemes(base)
    setTheme(name)
  }

  function preview(next: CustomTheme) {
    setCustomThemes([{ ...next, id: PREVIEW_ID }, ...base])
    setTheme('custom')
    applyCustom(PREVIEW_ID)
  }

  function startEdit(source: CustomTheme, asNew: boolean) {
    preEditTheme.current = theme
    preEditActiveId.current = activeId
    const next = asNew ? { ...source, id: '', name: '' } : { ...source }
    setDraft(next)
    setName(next.name)
    preview(next)
  }

  // Admin-only: import a theme JSON file, strictly validated, into the builder for
  // review before saving. A bad/untrusted file is rejected with a clear message.
  async function importTheme(file: File) {
    try {
      const parsed = themeFileSchema.safeParse(JSON.parse(await file.text()))
      if (!parsed.success) {
        toast.error(
          `Invalid theme file: ${parsed.error.issues[0]?.message ?? 'unrecognized shape'}`,
        )
        return
      }
      startEdit({ id: '', ...parsed.data }, false)
      toast.success(`Imported “${parsed.data.name}” — review and save`)
    } catch {
      toast.error('Could not read theme file (not valid JSON)')
    }
  }

  function cancelEdit() {
    setDraft(null)
    setCustomThemes(base)
    if (preEditTheme.current === 'custom' && preEditActiveId.current) {
      applyCustom(preEditActiveId.current)
    } else {
      setTheme(preEditTheme.current)
    }
  }

  function setToken(key: keyof ThemeTokens, value: string) {
    if (!draft) return
    const next = { ...draft, [mode]: { ...draft[mode], [key]: value } }
    setDraft(next)
    preview(next)
  }

  async function save() {
    if (!draft) return
    setBusy(true)
    const res = await saveThemeAction({
      id: draft.id || undefined,
      name,
      light: draft.light,
      dark: draft.dark,
    })
    setBusy(false)
    if (!res.ok || !res.theme) {
      toast.error(res.ok ? 'Could not save theme' : res.error)
      return
    }
    const saved = res.theme
    const nextThemes = [...myThemes.filter((t) => t.id !== saved.id), saved]
    setMyThemes(nextThemes)
    setDraft(null)
    const nextBase = dedupe([...(global ? [global] : []), ...nextThemes, ...presets])
    setCustomThemes(nextBase)
    setTheme('custom')
    applyCustom(saved.id)
    toast.success('Theme saved')
    router.refresh()
  }

  async function remove(id: string) {
    setBusy(true)
    const res = await deleteThemeAction(id)
    setBusy(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    const nextThemes = myThemes.filter((t) => t.id !== id)
    setMyThemes(nextThemes)
    if (draft?.id === id) setDraft(null)
    setCustomThemes(dedupe([...(global ? [global] : []), ...nextThemes, ...presets]))
    toast.success('Theme deleted')
    router.refresh()
  }

  async function makeGlobal() {
    if (!draft) return
    setBusy(true)
    const res = await setGlobalThemeAction({
      name: name || draft.name || 'Global theme',
      light: draft.light,
      dark: draft.dark,
    })
    setBusy(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setGlobal(res.theme ?? null)
    toast.success('Published as the global default')
    router.refresh()
  }

  async function removeGlobal() {
    setBusy(true)
    const res = await clearGlobalThemeAction()
    setBusy(false)
    if (!res.ok) {
      toast.error(res.error)
      return
    }
    setGlobal(null)
    toast.success('Global default cleared')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-8">
      <Toolbar
        mode={mode}
        setMode={setMode}
        onNew={() => startEdit(draftFromPreset(), true)}
        onImport={isAdmin ? () => importRef.current?.click() : undefined}
      />
      <input
        ref={importRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void importTheme(file)
          if (importRef.current) importRef.current.value = ''
        }}
      />

      {global && (
        <p
          role="status"
          className="border-border bg-muted/40 text-muted-foreground border px-3 py-2 text-sm"
          style={{ borderRadius: 'var(--radius)' }}
        >
          App-wide default: <strong className="text-foreground">{global.name}</strong>
          {' — '}members see it until they choose their own.
        </p>
      )}

      <ThemeSection title="Built-in skins">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={theme === 'branded' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => applyBuiltin('branded')}
          >
            Branded
          </Button>
          <Button
            variant={theme === 'plain' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => applyBuiltin('plain')}
          >
            Plain
          </Button>
        </div>
      </ThemeSection>

      <ThemeSection title="Preloaded themes">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {presets.map((preset) => (
            <ThemeCard
              key={preset.id}
              theme={preset}
              mode={mode}
              active={activeId === preset.id}
              onApply={() => applyExisting(preset.id)}
              onEdit={() => startEdit(preset, true)}
              onExport={() => exportTheme(preset)}
              editLabel="Customize"
            />
          ))}
        </div>
      </ThemeSection>

      <ThemeSection title="Your themes">
        {myThemes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            None yet — customize a preset and save it to build your own.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {myThemes.map((t) => (
              <ThemeCard
                key={t.id}
                theme={t}
                mode={mode}
                active={activeId === t.id}
                isGlobal={global?.name === t.name}
                onApply={() => applyExisting(t.id)}
                onEdit={() => startEdit(t, false)}
                onExport={() => exportTheme(t)}
                onDelete={() => remove(t.id)}
                editLabel="Edit"
              />
            ))}
          </div>
        )}
      </ThemeSection>

      {draft && (
        <Editor
          draft={draft}
          mode={mode}
          name={name}
          busy={busy}
          isAdmin={isAdmin}
          hasGlobal={global !== null}
          onName={setName}
          onToken={setToken}
          onSave={save}
          onCancel={cancelEdit}
          onMakeGlobal={makeGlobal}
          onClearGlobal={removeGlobal}
        />
      )}
    </div>
  )
}

function Toolbar({
  mode,
  setMode,
  onNew,
  onImport,
}: {
  mode: Mode
  setMode: (m: Mode) => void
  onNew: () => void
  /** Admin-only theme import; omitted for non-admins. */
  onImport?: () => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div
        role="group"
        aria-label="Preview mode"
        className="border-border inline-flex border p-0.5"
        style={{ borderRadius: 'var(--radius)' }}
      >
        {(['light', 'dark'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-3 py-1 text-sm capitalize transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 ${
              mode === m ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
            style={{ borderRadius: 'calc(var(--radius) - 1px)' }}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {onImport && (
          <Button variant="outline" size="sm" onClick={onImport}>
            <DownloadIcon className="h-4 w-4 rotate-180" aria-hidden="true" />
            Import
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onNew}>
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          New theme
        </Button>
      </div>
    </div>
  )
}

function ThemeSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl leading-[1.4] font-semibold">{title}</h2>
      {children}
    </section>
  )
}

interface ThemeCardProps {
  theme: CustomTheme
  mode: Mode
  active: boolean
  isGlobal?: boolean
  editLabel: string
  onApply: () => void
  onEdit: () => void
  onExport: () => void
  onDelete?: () => void
}

function ThemeCard({
  theme,
  mode,
  active,
  isGlobal,
  editLabel,
  onApply,
  onEdit,
  onExport,
  onDelete,
}: ThemeCardProps) {
  const tokens = theme[mode]
  const wcag = worstLevel([...tokenContrastPairs(theme.light), ...tokenContrastPairs(theme.dark)])
  return (
    <div
      className="border-border bg-card flex flex-col gap-3 border p-3"
      style={{ borderRadius: 'var(--radius)', borderColor: active ? tokens.primary : undefined }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-foreground flex items-center gap-1.5 text-sm font-semibold">
          {theme.name}
          {active && <CheckIcon className="text-brand-lime h-4 w-4" aria-label="Active" />}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {isGlobal && (
            <span className="text-muted-foreground border-border rounded border px-1.5 py-0.5 text-xs">
              Global
            </span>
          )}
          <Badge tone={levelTone(wcag)}>{wcag === 'fail' ? 'A11y fail' : wcag}</Badge>
        </span>
      </div>
      <div
        className="flex h-10 items-center gap-1.5 px-2"
        style={{ background: tokens.background, borderRadius: 'var(--radius)' }}
        aria-hidden="true"
      >
        {SWATCH_KEYS.map((k) => (
          <span
            key={k}
            className="h-5 w-5 rounded-full"
            style={{ background: tokens[k], border: `1px solid ${tokens.border}` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={onApply}>
          Apply
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          {editLabel}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          aria-label={`Download ${theme.name} as JSON`}
        >
          <DownloadIcon className="h-4 w-4" aria-hidden="true" />
        </Button>
        {onDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} aria-label={`Delete ${theme.name}`}>
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  )
}

interface EditorProps {
  draft: CustomTheme
  mode: Mode
  name: string
  busy: boolean
  isAdmin: boolean
  hasGlobal: boolean
  onName: (v: string) => void
  onToken: (key: keyof ThemeTokens, value: string) => void
  onSave: () => void
  onCancel: () => void
  onMakeGlobal: () => void
  onClearGlobal: () => void
}

function Editor({
  draft,
  mode,
  name,
  busy,
  isAdmin,
  hasGlobal,
  onName,
  onToken,
  onSave,
  onCancel,
  onMakeGlobal,
  onClearGlobal,
}: EditorProps) {
  const tokens = draft[mode]
  return (
    <section
      className="border-border bg-card flex flex-col gap-5 border p-4"
      style={{ borderRadius: 'var(--radius)' }}
      aria-label="Theme editor"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="theme-name" className="text-sm font-medium">
          Theme name
        </label>
        <Input
          id="theme-name"
          value={name}
          onChange={(e) => onName(e.target.value)}
          maxLength={60}
          placeholder="My theme"
          className="max-w-sm"
        />
      </div>

      <p className="text-muted-foreground text-sm">
        Editing the <strong className="text-foreground capitalize">{mode}</strong> palette — switch
        preview mode above to edit the other one. Changes preview live.
      </p>

      <ContrastIndicator tokens={tokens} mode={mode} />

      {TOKEN_GROUPS.map((group) => (
        <fieldset key={group.legend} className="flex flex-col gap-2">
          <legend className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
            {group.legend}
          </legend>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.fields.map((field) => (
              <ColorField
                key={field.key}
                label={field.label}
                value={tokens[field.key] ?? ''}
                onChange={(v) => onToken(field.key, v)}
              />
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-col gap-1">
        <label htmlFor="theme-radius" className="text-sm font-medium">
          Corner radius
        </label>
        <select
          id="theme-radius"
          value={tokens.radius}
          onChange={(e) => onToken('radius', e.target.value)}
          className="border-border bg-card w-full max-w-40 border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: 'var(--radius)' }}
        >
          {RADIUS_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      <div className="border-border flex flex-wrap items-center gap-2 border-t pt-4">
        <Button onClick={onSave} disabled={busy || !name.trim()}>
          {draft.id ? 'Save changes' : 'Save theme'}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        {isAdmin && (
          <Button variant="secondary" onClick={onMakeGlobal} disabled={busy}>
            Set as global default
          </Button>
        )}
        {isAdmin && hasGlobal && (
          <Button variant="ghost" onClick={onClearGlobal} disabled={busy}>
            Clear global default
          </Button>
        )}
      </div>
    </section>
  )
}

function levelTone(level: WcagLevel): BadgeTone {
  return level === 'fail' ? 'danger' : level === 'AA' ? 'warn' : 'success'
}

// Live WCAG check for the mode being edited — every theme must stay legible in light
// and dark, so the builder shows the contrast ratio + level for each text pair.
function ContrastIndicator({ tokens, mode }: { tokens: ThemeTokens; mode: Mode }) {
  const pairs = tokenContrastPairs(tokens)
  const overall = worstLevel(pairs)
  return (
    <div
      className="border-border flex flex-col gap-2 border p-3"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium capitalize">{mode} accessibility (WCAG)</span>
        <Badge tone={levelTone(overall)}>
          {overall === 'fail' ? 'Fails AA' : `Passes ${overall}`}
        </Badge>
      </div>
      <ul className="flex flex-col gap-1 text-xs">
        {pairs.map((pair) => (
          <li key={pair.label} className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">{pair.label}</span>
            <span className="flex items-center gap-2">
              <span className="text-muted-foreground tabular-nums">{pair.ratio.toFixed(2)}:1</span>
              <Badge tone={levelTone(pair.level)}>
                {pair.level === 'fail' ? 'Fail' : pair.level}
              </Badge>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  // Strip anything outside the hex alphabet so a live preview can never inject CSS;
  // the server re-validates on save.
  const sanitize = (v: string) => v.replace(/[^#0-9a-fA-F]/g, '').slice(0, 9)
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="color"
        value={toSwatch(value)}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label} color picker`}
        className="border-border h-9 w-10 shrink-0 cursor-pointer border bg-transparent"
        style={{ borderRadius: 'var(--radius)' }}
      />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-muted-foreground text-xs">{label}</span>
        <input
          value={value}
          onChange={(e) => onChange(sanitize(e.target.value))}
          aria-label={`${label} hex value`}
          spellCheck={false}
          className="border-border bg-background w-full border px-2 py-1 font-mono text-xs focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ borderRadius: 'var(--radius)' }}
        />
      </span>
    </label>
  )
}
