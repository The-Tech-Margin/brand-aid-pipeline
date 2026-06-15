# Accessibility

Brand Helper aims to meet **WCAG 2.1 AA** across both the branded and plain skins. Accessibility is
treated as a build requirement, not an afterthought.

## What we do

- **Semantic HTML first** — native `<button>`, `<label>`, `<input>`, headings, and landmarks before
  ARIA. ARIA is added only where a native element can't express the pattern.
- **Keyboard operable** — every interactive control is reachable and operable by keyboard. Dialogs
  (including the command palette) trap focus, restore it on close, and close on `Esc`; menus, tabs,
  and the creative grid use roving-tabindex / arrow-key navigation (ARIA APG patterns).
- **Global shortcuts** — `⌘K` / `Ctrl+K` or `?` open the quick-actions & help palette from anywhere
  (suppressed while typing in a field); `Esc` dismisses menus and dialogs. These are listed for end
  users in the in-app **Help** guide → _Keyboard & accessibility_.
- **Visible focus** — a global `:focus-visible` ring (2px, offset) on all focusable elements.
- **Labels & errors** — form controls are associated with labels; errors use `role="alert"` and
  `aria-describedby` (see the login form). Toasts announce via `role="alert"` (errors) / `role="status"`.
- **Not color alone** — status is conveyed by icon + text + token color, never color alone.
- **Contrast** — text/surface pairs target WCAG AA; the compositor asserts overlay contrast in
  `src/features/pipeline/compliance`.
- **Reduced motion** — a global `prefers-reduced-motion: reduce` rule collapses animations and
  transitions to ~0ms.
- **Responsive & zoom** — fluid down to ~360px, no horizontal scroll, safe at 200% text zoom; 44px
  touch targets on small screens.

## How it's enforced

- **Linting** — `eslint-plugin-jsx-a11y` (recommended rule set) runs in `npm run lint`, which is a
  required CI gate. Justified deviations carry an inline `eslint-disable-next-line … -- reason`.
- **Automated checks** — `jest-axe` smoke tests assert no axe violations on key UI
  (`src/components/ui/a11y.test.tsx`); run with `npm test`.
- **Design system** — [design-system.md](design-system.md) makes WCAG 2.1 AA a hard requirement for
  both skins.

## Manual testing we expect for UI changes

Keyboard-only navigation, a screen reader (VoiceOver / NVDA), 200% zoom, and dark + light modes.

The **in-app editor** canvas (Konva) renders to `<canvas>`, which is not natively accessible, so its
operability lives in the surrounding controls: every toolbar action is a real `<button>` with a verb
label, the brand-color swatches carry `aria-label`s, and placed elements appear in a keyboard-operable
**Elements** row — select one, then arrow keys move it (Shift = larger steps), `Delete` removes it, and
`Enter` edits text. Add / select / move / delete / recolor / edit are therefore all possible without a
mouse; **resizing and rotating still require a pointer**. The canvas wrapper is a labelled `role="group"`
with a screen-reader summary, and long AI ops announce via a `role="status"` live region. When changing
the editor, verify the canvas is never the only way to perform an action.

## Reporting an issue

Found a barrier? Please open an
[accessibility issue](https://github.com/The-Tech-Margin/brand-helper/issues/new/choose) (use the
**Accessibility** template) or email **sonia@thetechmargin.com**. Include the page, what failed, your
assistive tech / browser, and the WCAG criterion if you know it. We triage a11y issues with priority.
