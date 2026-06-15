'use client'

// App-wide theme context. Owns the (theme x mode) selection, persists it to a
// cookie for flash-free SSR, applies it to <html>, and injects a custom theme's
// tokens as a scoped <style> when the custom skin is active.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  type CustomTheme,
  type Mode,
  type ThemeName,
  THEME_COOKIE,
  MODE_COOKIE,
  CUSTOM_COOKIE,
} from '@/components/theme/constants'
import { customThemeCss } from '@/components/theme/apply'

interface ThemeContextValue {
  theme: ThemeName
  mode: Mode
  customThemes: CustomTheme[]
  activeCustom?: CustomTheme
  setTheme: (theme: ThemeName) => void
  setMode: (mode: Mode) => void
  toggleMode: () => void
  setCustomThemes: (themes: CustomTheme[]) => void
  applyCustom: (id: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STYLE_ID = 'bh-custom-theme'

function persist(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`
}

interface ThemeProviderProps {
  initialTheme: ThemeName
  initialMode: Mode
  initialCustomThemes?: CustomTheme[]
  initialActiveCustomId?: string
  children: ReactNode
}

export function ThemeProvider({
  initialTheme,
  initialMode,
  initialCustomThemes = [],
  initialActiveCustomId,
  children,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeName>(initialTheme)
  const [mode, setModeState] = useState<Mode>(initialMode)
  const [customThemes, setCustomThemes] = useState<CustomTheme[]>(initialCustomThemes)
  const [activeCustomId, setActiveCustomId] = useState<string | undefined>(
    initialActiveCustomId ?? initialCustomThemes[0]?.id,
  )

  const activeCustom = useMemo(
    () => customThemes.find((t) => t.id === activeCustomId),
    [customThemes, activeCustomId],
  )

  // Don't persist on the initial render — the SSR-resolved theme (which may be the
  // admin's global default) should keep applying until the user explicitly changes it,
  // so a later change to the global default still reaches members who never overrode it.
  const mounted = useRef(false)

  // Reflect theme/mode onto <html> and persist subsequent changes for the next SSR pass.
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    if (mounted.current) persist(THEME_COOKIE, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.mode = mode
    if (mounted.current) persist(MODE_COOKIE, mode)
  }, [mode])

  // Persist the active custom theme id so the next SSR pass restores it flash-free.
  useEffect(() => {
    if (mounted.current && activeCustomId) persist(CUSTOM_COOKIE, activeCustomId)
  }, [activeCustomId])

  useEffect(() => {
    mounted.current = true
  }, [])

  // Inject (or remove) the active custom theme's CSS.
  useEffect(() => {
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (theme === 'custom' && activeCustom) {
      if (!style) {
        style = document.createElement('style')
        style.id = STYLE_ID
        document.head.appendChild(style)
      }
      style.textContent = customThemeCss(activeCustom)
    } else if (style) {
      style.remove()
    }
  }, [theme, activeCustom])

  const setTheme = useCallback((next: ThemeName) => setThemeState(next), [])
  const setMode = useCallback((next: Mode) => setModeState(next), [])
  const toggleMode = useCallback(() => setModeState((m) => (m === 'dark' ? 'light' : 'dark')), [])
  const applyCustom = useCallback((id: string) => {
    setActiveCustomId(id)
    setThemeState('custom')
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      mode,
      customThemes,
      activeCustom,
      setTheme,
      setMode,
      toggleMode,
      setCustomThemes,
      applyCustom,
    }),
    [theme, mode, customThemes, activeCustom, setTheme, setMode, toggleMode, applyCustom],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/** Access the theme context; throws if used outside the provider. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
