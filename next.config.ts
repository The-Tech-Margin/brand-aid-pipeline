import type { NextConfig } from 'next'

// sharp ships native binaries; @react-pdf/renderer breaks when bundled (its internal
// module resolution must load at runtime) — keep both external so server bundles
// load them at runtime (matters for the compositor + PDF deliverables on Vercel).
const nextConfig: NextConfig = {
  // Pin the workspace root to this project — a stray lockfile in $HOME would
  // otherwise make Next infer the home directory as the root. cwd is the project
  // root for dev/build/Vercel and avoids unreliable import.meta.dirname here.
  turbopack: { root: process.cwd() },
  serverExternalPackages: ['sharp', '@react-pdf/renderer'],
  // Creative thumbnails are served from short-lived Supabase Storage signed URLs.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/**' }],
  },
  outputFileTracingIncludes: {
    // Ensure overlay fonts + the brand logo are traced into serverless functions that
    // composite creatives and render branded PDF / social-asset deliverables.
    '/api/**': ['./public/fonts/**', './public/images/logo.png'],
  },
}

export default nextConfig
