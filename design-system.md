# Brand Helper Design System

Single source of truth for the visual language of the Brand Helper app and the
creative outputs it composites. All runtime values trace back to
`src/app/globals.css`. Skins and modes override the same semantic variables at
runtime via `html[data-theme="…"][data-mode="…"]`; user-saved custom themes
override them again through an injected `<style>` block (persisted in the
`brand_helper.themes` table).

This document mirrors the structure of the Four Corners design system, tailored
to Brand Helper's workflow: brief intake → run → creative browser → run report.

---

## Architecture

Two layers, one runtime source of truth:

```
Runtime source of truth          Tailwind bridge
───────────────────────          ───────────────
--background, --foreground,      @theme inline {
--brand-pink, --ring, …            --color-background: var(--background);
  (redefined per skin×mode)        --color-brand-pink: var(--brand-pink);
                                 }  →  enables bg-background, text-brand-pink
```

- The **semantic variables** (`--background`, `--card`, `--brand-pink`, `--ring`,
  `--radius-token`, …) are the runtime truth. Each `[data-theme][data-mode]`
  selector redefines them.
- The **`@theme inline` block** maps those into Tailwind color/font/radius
  utilities so components are written with utilities (`bg-card`, `text-brand-pink`,
  `font-display`, `rounded-[var(--radius)]`) and theme switching cascades for free.
- **Components never hardcode hex.** They consume utilities backed by
  `var(--*)`. The only hardcoded colors allowed are inside the brand-gradient
  `.gradient-text` (cyan → pink → hot-red; branded-only decorative).

**Rule:** a new color used in a component must resolve to a semantic variable. If
it needs a new token, add it to every skin×mode block in `globals.css` and to the
`@theme inline` bridge.

---

## Tokens

> The token-value tables below are **auto-generated from `src/app/globals.css`** by
> `npm run docs:gen` (CI enforces sync via `npm run docs:check`). Edit the CSS —
> not the tables — and regenerate. Everything outside the `<!-- gen:* -->` markers
> is hand-authored.

### Surfaces

<!-- gen:surfaces:start -->

| Token          | Branded Dark | Branded Light | Plain Dark | Plain Light | Use                      |
| -------------- | ------------ | ------------- | ---------- | ----------- | ------------------------ |
| `--background` | `#0a0a0a`    | `#f2ede1`     | `#0a0a0a`  | `#ffffff`   | Page background          |
| `--card`       | `#161616`    | `#fbf8f0`     | `#161616`  | `#ffffff`   | Cards, panels, modals    |
| `--muted`      | `#1f1f1f`    | `#e7e0d2`     | `#1f1f1f`  | `#f4f4f5`   | Recessed areas, hovers   |
| `--border`     | `#2a2a2a`    | `#d8cfba`     | `#2a2a2a`  | `#e4e4e7`   | Hairlines, input borders |

<!-- gen:surfaces:end -->

> **Branded-dark surfaces are neutral grays, not navy.** The brand identity lives
> in the neon accents; surfaces stay neutral (a deliberate deviation from the
> legacy `#030729` navy still listed on brand.thetechmargin.com). Branded light is
> unchanged (warm paper).

### Text

<!-- gen:text:start -->

| Token                | Branded Dark | Branded Light | Plain Dark | Plain Light | Use                     |
| -------------------- | ------------ | ------------- | ---------- | ----------- | ----------------------- |
| `--foreground`       | `#ffffff`    | `#2b2a28`     | `#ededed`  | `#171717`   | Headings, body          |
| `--muted-foreground` | `#a1a1aa`    | `#5c574d`     | `#a1a1aa`  | `#71717a`   | Labels, metadata, hints |

<!-- gen:text:end -->

### Brand accents

Neon on branded; collapse to grays on plain (so the plain skin stays equally
polished with no brand hues).

<!-- gen:brand:start -->

| Token               | Branded Dark | Branded Light | Plain (both) | Use                          |
| ------------------- | ------------ | ------------- | ------------ | ---------------------------- |
| `--brand-pink`      | `#e904e5`    | `#c1248f`     | neutral gray | Primary CTAs, h1 accents     |
| `--brand-lime`      | `#a1ff00`    | `#5f7d1f`     | neutral gray | Success / pass status        |
| `--brand-cyan`      | `#09fff0`    | `#0a8f86`     | neutral gray | Focus ring, secondary        |
| `--brand-hot-red`   | `#ff0080`    | `#c11f63`     | neutral gray | Errors / fail status / heart |
| `--brand-goldenrod` | `#ff9500`    | `#b06a05`     | neutral gray | Warnings / warn status       |

<!-- gen:brand:end -->

### Semantic roles

Map to the brand accents but name the role, so components read by intent.

All are theme-customizable in the studio, so a custom theme overrides them
(not just `--primary`).

| Token                         | Use                          |
| ----------------------------- | ---------------------------- |
| `--primary` / `-foreground`   | Primary button (pink)        |
| `--secondary` / `-foreground` | Secondary button (cyan)      |
| `--tertiary` / `-foreground`  | Tertiary accent (lime)       |
| `--accent` / `-foreground`    | Hover/active surface (lime)  |
| `--ring`                      | Focus-visible outline (cyan) |

### Status mapping (compliance / legal / run state)

| State            | Token                | Notes                           |
| ---------------- | -------------------- | ------------------------------- |
| pass / succeeded | `--brand-lime`       | Collapses to gray on plain skin |
| warn / running   | `--brand-goldenrod`  | "                               |
| fail / error     | `--brand-hot-red`    | "                               |
| info / pending   | `--muted-foreground` | Neutral in all skins            |

---

## Z-Index Scale

Establish a named scale (add to `globals.css`). Never use raw numbers in
components — reference the variable. (The existing skip-link's `z-index: 50`
maps to `--z-header`.)

| Token           | Value | Use                           |
| --------------- | ----- | ----------------------------- |
| `--z-base`      | 1     | Default positioned elements   |
| `--z-content`   | 10    | General content               |
| `--z-controls`  | 20    | Toolbars, run/view controls   |
| `--z-card-menu` | 30    | Card context menus            |
| `--z-header`    | 50    | Sticky app header, skip-link  |
| `--z-menu`      | 55    | Dropdown menus (theme toggle) |
| `--z-modal`     | 60    | Dialogs / sheets              |
| `--z-overlay`   | 9999  | Fullscreen creative lightbox  |

---

## Radius

Driven by `--radius-token`, exposed to Tailwind as `--radius`.

<!-- gen:radius:start -->

| Skin    | `--radius-token` | `--radius-lg` |
| ------- | ---------------- | ------------- |
| branded | `0.2rem`         | `0.4rem`      |
| plain   | `0.2rem`         | `0.4rem`      |

<!-- gen:radius:end -->

Branded follows the TTM brand radius scale (`0 / 3px / full`); there is no large
brand radius, so hero surfaces also use `3px`. Plain keeps a softer `1rem`.

Components use `rounded-[var(--radius)]` (or the `rounded-lg` → `--radius-lg`
mapping for hero surfaces). **Composited creative PNGs are not part of this
scale** — their corner/letterbox geometry is owned by `src/features/pipeline/compositor`.

---

## Typography

Loaded via `next/font/google` in `src/app/layout.tsx`, exposed as CSS variables.

| Font          | Variable               | Tailwind        | Use                          |
| ------------- | ---------------------- | --------------- | ---------------------------- |
| Poppins       | `--font-poppins`       | `font-sans`     | Body, UI, headings           |
| Pacifico      | `--font-pacifico`      | `font-display`  | Display headlines, logo word |
| Geist Mono    | `--font-geist-mono`    | `font-mono`     | Run log, metadata, code      |
| IBM Plex Mono | `--font-ibm-plex-mono` | `font-terminal` | Terminal skin (bonus)        |

Pacifico rules (per brand): never uppercase, line-height ≥ 1.4, 24px+. Base body
16px; minimum legible text 14px.

---

## Skins, Modes & Custom Themes

- **Skin** via `html[data-theme]`: `branded` (default) · `plain` · `custom`.
- **Mode** via `html[data-mode]`: `dark` (default) · `light`.
- Both attributes are read from cookies during SSR (`src/app/layout.tsx`) so the
  first paint is flash-free, then owned by `src/components/theme/theme-provider.tsx`.
- **Custom themes** are user-defined token overrides persisted in
  `brand_helper.themes` (`tokens jsonb`, one `is_default` per user) and injected
  as a `<style id="bh-custom-theme">` block at runtime — the Brand Helper analog
  of Four Corners persona palettes. They override any semantic variable.
- The **branded footer** (`made with ♥ by thetechmargin`) and the brand-gradient
  `.gradient-text` render only on branded; both are suppressed on `[data-theme='plain']`
  via `globals.css`.

---

## Component Patterns

Two tiers, with a clear rule for which to reach for:

### Tier 1 — Primitives (`src/components/ui/`)

Token-mapped, `cva`-variant components matching the existing bespoke style
(`login-form`, `theme-toggle`). Utility-first; no BEM classes. Named exports
only, `interface XxxProps`, `"use client"` only when stateful.

| Primitive             | File                           |
| --------------------- | ------------------------------ |
| `Button`              | `src/components/ui/button.tsx` |
| `Input` / `Textarea`  | `src/components/ui/input.tsx`  |
| `Field`               | `src/components/ui/field.tsx`  |
| `Card`                | `src/components/ui/card.tsx`   |
| `Select`              | `src/components/ui/select.tsx` |
| `Tabs`                | `src/components/ui/tabs.tsx`   |
| `Dialog` / `Sheet`    | `src/components/ui/dialog.tsx` |
| `Badge` / `StatusDot` | `src/components/ui/badge.tsx`  |

### Tier 2 — Domain component classes (`bh-` prefix, in `globals.css`)

When a rich surface (the creative grid, run-report panels) makes utility soup
unreadable, define a BEM-ish `bh-` class — the Four Corners `.fc-panel` pattern,
tailored here:

```
.bh-creative-grid                — block
.bh-creative-grid__cell          — element
.bh-creative-grid__cell--focused — state (roving tabindex)
.bh-run-panel                    — block
.bh-run-panel--legal             — modifier
```

All `bh-` classes consume `var(--*)` tokens only. **Rule:** primitives and
simple layouts use Tier 1; only reach for Tier 2 when state-driven styling or
repetition across a complex widget justifies it.

---

## Creative Output Framing

The compositor (`src/features/pipeline/compositor`) renders the on-image brand framing. It is
theme-aware via an explicit `BrandFraming` value (not the DOM), with three modes:

| Mode      | Logo | Color bar          | Message text       |
| --------- | ---- | ------------------ | ------------------ |
| `branded` | yes  | from brand palette | white, scrim below |
| `plain`   | no   | none               | white, scrim below |
| `custom`  | opt. | user palette       | configurable       |

Constraints: logo ≥ 25% clear space, ≥ 16px, never recolored/distorted; message
text honors safe-area padding and WCAG AA contrast (asserted by
`src/features/pipeline/compliance`).

---

## Mobile Constraints

- 44px minimum touch targets on screens ≤ 768px (creative grid, toggle, forms).
- `touch-action: manipulation` globally.
- Safe-area padding via `env(safe-area-inset-*)` on any fixed bottom bar.
- Fully fluid ~360px → wide desktop; no horizontal scroll; 200% text zoom safe.

---

## Accessibility (WCAG 2.1 AA — hard requirement, both skins)

- `:focus-visible` → 2px solid `--ring`, 2px offset (global, already in
  `globals.css`).
- `prefers-reduced-motion: reduce` → animations ≈ 0.01ms (global).
- Skip-to-content link, visible only on focus.
- Every interactive control that owns another region wires `aria-controls` ⇄
  `id` with `aria-expanded`/`aria-selected`/`aria-current`; menus/dialogs/tabs
  follow the `theme-toggle` pattern (Arrow keys, Esc, focus trap + restore,
  roving tabindex). The creative grid extends this to 2D Arrow-key navigation.
- Forms follow `login-form`: `useId`, `aria-describedby`, `role="alert"` errors.
- No color-only state; status uses icon/label + token color.

---

## Tailwind Integration

The `@theme inline` block in `globals.css` is the **bridge**, not the source of
truth — the `var(--*)` runtime variables are. Any Tailwind utility that touches a
themed color must resolve through `var(--*)` (already true for the bridged
tokens). If a utility doesn't need theme-awareness, a static value is fine.

---

## File Organization

```
src/app/globals.css                       — All tokens, z-scale, bh-* component styles, overrides
src/app/layout.tsx                        — Font loading; SSR cookie read for theme/mode
src/components/theme/theme-provider.tsx     — Runtime data-theme/data-mode + custom theme injection
src/components/theme/theme-toggle.tsx       — Canonical a11y/keyboard pattern (mirror in primitives)
src/components/ui/*                        — Tier 1 primitives (to build)
src/features/pipeline/compositor/*                       — Creative output framing (separate visual surface)
brand_helper.themes (Supabase)          — Persisted custom themes (tokens jsonb)
```
