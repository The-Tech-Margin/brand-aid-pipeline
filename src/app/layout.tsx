// Root layout — loads brand fonts, applies the persisted theme/mode for flash-free
// SSR, and provides the skip link + theme context for the whole app.
import type { Metadata } from 'next'
import { Poppins, Pacifico, Geist_Mono, IBM_Plex_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import {
  THEME_COOKIE,
  MODE_COOKIE,
  CUSTOM_COOKIE,
  DEFAULT_THEME,
  DEFAULT_MODE,
  isThemeName,
  isMode,
  type CustomTheme,
  type ThemeName,
} from '@/components/theme/constants'
import { THEME_PRESETS } from '@/components/theme/presets'
import { customThemeCss } from '@/components/theme/apply'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { listMyThemes, getGlobalTheme } from '@/features/theme/data'
import { getMyMembership } from '@/features/members/data'
import { resolveBrand } from '@/features/brand-identity/data'
import { DEFAULT_BRAND, type Brand } from '@/features/brand-identity/constants'
import { sanitizeFontFamily, googleFontsHref } from '@/features/brand-identity/fonts'
import type { MemberRow } from '@/types/database'
import { ToastProvider } from '@/components/feedback/toast'
import { BrandProvider } from '@/features/brand-identity/brand-context'
import { SiteHeader } from '@/components/layout/site-header'
import { BrandFooter } from '@/components/layout/footer'

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})
const pacifico = Pacifico({
  variable: '--font-pacifico',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
})
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const ibmPlexMono = IBM_Plex_Mono({
  variable: '--font-ibm-plex-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Brand Helper — Creative Automation Pipeline',
  description: 'Turn a campaign brief into on-brand, ready-to-post social ad creatives at scale.',
  authors: [{ name: 'TheTechMargin' }],
  openGraph: { title: 'Brand Helper', siteName: 'Brand Helper' },
}

function dedupeById(themes: CustomTheme[]): CustomTheme[] {
  const seen = new Set<string>()
  return themes.filter((t) => (seen.has(t.id) ? false : (seen.add(t.id), true)))
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies()
  const themeCookie = cookieStore.get(THEME_COOKIE)?.value
  const modeCookie = cookieStore.get(MODE_COOKIE)?.value
  const customCookie = cookieStore.get(CUSTOM_COOKIE)?.value
  const mode = isMode(modeCookie) ? modeCookie : DEFAULT_MODE

  // Presets are always available; a signed-in member additionally gets their saved
  // themes and the admin-set global default. Only query when a session cookie exists
  // so public pages don't pay for an RLS-empty round trip.
  const hasSession = cookieStore.getAll().some((c) => c.name.startsWith('sb-'))
  const [userThemes, globalTheme, membership, brand] = hasSession
    ? await Promise.all([listMyThemes(), getGlobalTheme(), getMyMembership(), resolveBrand()])
    : [[] as CustomTheme[], null, null as MemberRow | null, DEFAULT_BRAND as Brand]

  const customThemes = dedupeById([
    ...(globalTheme ? [globalTheme] : []),
    ...userThemes,
    ...THEME_PRESETS,
  ])

  // Resolve the active skin: an explicit cookie wins; otherwise the admin global
  // default applies; otherwise the branded default.
  let theme: ThemeName
  let activeCustomId: string | undefined
  if (isThemeName(themeCookie)) {
    theme = themeCookie
    activeCustomId =
      customCookie && customThemes.some((t) => t.id === customCookie)
        ? customCookie
        : (globalTheme?.id ?? customThemes[0]?.id)
  } else if (globalTheme) {
    theme = 'custom'
    activeCustomId = globalTheme.id
  } else {
    theme = DEFAULT_THEME
    activeCustomId = customThemes[0]?.id
  }
  const activeCustom = customThemes.find((t) => t.id === activeCustomId)

  const fontVars = `${poppins.variable} ${pacifico.variable} ${geistMono.variable} ${ibmPlexMono.variable}`

  // A brand can pick any Google Font for the decorative wordmark; load it at runtime and
  // point --font-decorative at it (globals.css falls back to Pacifico when unset). The
  // family is re-sanitized here, so it is safe to interpolate into the URL and CSS.
  const displayFont = sanitizeFontFamily(brand.displayFont)

  return (
    <html lang="en" data-theme={theme} data-mode={mode} className={`${fontVars} h-full`}>
      <body className="flex min-h-full flex-col antialiased">
        {displayFont && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="stylesheet" href={googleFontsHref(displayFont)} />
            <style
              id="bh-display-font"
              dangerouslySetInnerHTML={{ __html: `:root{--font-decorative:'${displayFont}'}` }}
            />
          </>
        )}
        {theme === 'custom' && activeCustom && (
          // Validated tokens only (hex/length) — see theme/schema.ts. Server-injected
          // so a custom/global theme paints without a flash; the provider keeps it live.
          <style
            id="bh-custom-theme"
            dangerouslySetInnerHTML={{ __html: customThemeCss(activeCustom) }}
          />
        )}
        <a href="#content" className="skip-link">
          Skip to content
        </a>
        <ThemeProvider
          initialTheme={theme}
          initialMode={mode}
          initialCustomThemes={customThemes}
          initialActiveCustomId={activeCustomId}
        >
          <ToastProvider>
            <BrandProvider brand={brand}>
              <SiteHeader membership={membership} brand={brand} />
              {children}
              <BrandFooter />
            </BrandProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
