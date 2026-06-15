'use client'

// Quick light/dark toggle for the hamburger menu. Theme *skins* (branded/plain/custom)
// are managed in the Design studio, so they're intentionally not duplicated here.
// Rendered as a menuitemcheckbox so it joins the menu's keyboard roving and announces state.
import { useTheme } from '@/components/theme/theme-provider'
import { CheckIcon } from '@/components/icons'

export function AppearanceSection() {
  const { mode, toggleMode } = useTheme()
  return (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={mode === 'dark'}
      onClick={toggleMode}
      className="hover:bg-muted focus-visible:bg-muted flex w-full items-center gap-2 px-3 py-2 text-sm focus-visible:outline-none"
      style={{ borderRadius: 'var(--radius)' }}
    >
      <span className="flex-1 text-left">Dark mode</span>
      {mode === 'dark' && <CheckIcon className="h-4 w-4" aria-hidden="true" />}
    </button>
  )
}
