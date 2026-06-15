import { describe, it, expect, afterEach } from 'vitest'
import { getURL, isAppOrigin } from './get-url'

const KEYS = ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_VERCEL_URL', 'NEXT_PUBLIC_APP_ORIGINS'] as const

function clearEnv() {
  for (const k of KEYS) delete process.env[k]
}

describe('getURL', () => {
  afterEach(clearEnv)

  it('falls back to localhost (with protocol + trailing slash) when no env is set', () => {
    clearEnv()
    expect(getURL()).toBe('http://localhost:3000/')
  })

  it('prefers NEXT_PUBLIC_SITE_URL and keeps its protocol', () => {
    clearEnv()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://my-app.example.com'
    expect(getURL()).toBe('https://my-app.example.com/')
  })

  it('falls back to the Vercel deploy URL (adding https) when SITE_URL is unset', () => {
    clearEnv()
    process.env.NEXT_PUBLIC_VERCEL_URL = 'my-app-git-feature-xyz.vercel.app'
    expect(getURL()).toBe('https://my-app-git-feature-xyz.vercel.app/')
  })

  it('SITE_URL takes precedence over VERCEL_URL', () => {
    clearEnv()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://my-app.example.com'
    process.env.NEXT_PUBLIC_VERCEL_URL = 'my-app.vercel.app'
    expect(getURL()).toBe('https://my-app.example.com/')
  })

  it('does not double the trailing slash', () => {
    clearEnv()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://my-app.example.com/'
    expect(getURL()).toBe('https://my-app.example.com/')
  })
})

describe('isAppOrigin', () => {
  afterEach(clearEnv)

  it('accepts the site URL, the Vercel URL, and configured extra origins', () => {
    clearEnv()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://my-app.example.com'
    process.env.NEXT_PUBLIC_VERCEL_URL = 'my-app.vercel.app'
    process.env.NEXT_PUBLIC_APP_ORIGINS =
      'https://www.my-app.example.com, https://vanity.example.com'
    expect(isAppOrigin('https://my-app.example.com')).toBe(true)
    expect(isAppOrigin('https://my-app.vercel.app')).toBe(true)
    expect(isAppOrigin('https://www.my-app.example.com')).toBe(true)
    expect(isAppOrigin('https://vanity.example.com')).toBe(true)
  })

  it('accepts localhost on any port', () => {
    clearEnv()
    expect(isAppOrigin('http://localhost:3000')).toBe(true)
  })

  it('accepts the configured NEXT_PUBLIC_SITE_URL origin (trailing slash tolerated)', () => {
    clearEnv()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://custom.example.com/'
    expect(isAppOrigin('https://custom.example.com')).toBe(true)
  })

  it('rejects another app / unknown origin', () => {
    clearEnv()
    process.env.NEXT_PUBLIC_SITE_URL = 'https://my-app.example.com'
    expect(isAppOrigin('https://other.example.com')).toBe(false)
    expect(isAppOrigin('https://evil.example.com')).toBe(false)
  })
})
