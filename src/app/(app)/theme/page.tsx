// Design studio — brand identity (business name + logo) and theme. Loads the member's
// brand, saved themes, the admin-set globals, and their role, then hands them to the
// client editors. Auth is enforced by the (app) layout guard.
import Link from 'next/link'
import { listMyThemes, getGlobalTheme } from '@/features/theme/data'
import { getBrandStudioData } from '@/features/brand-identity/data'
import { DEFAULT_BRAND } from '@/features/brand-identity/constants'
import { getMyMembership } from '@/features/members/data'
import { THEME_PRESETS } from '@/components/theme/presets'
import { ThemeStudio } from '@/features/theme/components/theme-studio'
import { BrandPanel } from '@/features/brand-identity/components/brand-panel'

export const metadata = {
  title: 'Design · Brand Helper',
}

export default async function DesignPage() {
  const [userThemes, globalTheme, brand, membership] = await Promise.all([
    listMyThemes(),
    getGlobalTheme(),
    getBrandStudioData(),
    getMyMembership(),
  ])
  const isAdmin = membership?.role === 'admin'

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/dashboard" className="text-muted-foreground text-sm hover:underline">
          ← Dashboard
        </Link>
        <h1 className="mt-1 text-3xl leading-[1.4] font-semibold">
          <span className="gradient-text">Design</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Set your brand identity and theme. Both are saved to your account and follow you across
          devices.
          {isAdmin && ' As an admin, you can also publish either as the app-wide default.'}
        </p>
      </div>

      <BrandPanel
        initialBusinessName={brand.businessName}
        initialLogoUrl={brand.logoUrl}
        initialDisplayFont={brand.displayFont}
        global={brand.global}
        isAdmin={isAdmin}
        defaultBrand={DEFAULT_BRAND}
      />

      <ThemeStudio
        presets={THEME_PRESETS}
        userThemes={userThemes}
        globalTheme={globalTheme}
        isAdmin={isAdmin}
      />
    </div>
  )
}
