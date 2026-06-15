# Security Policy

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately to **sonia@thetechmargin.com** (or via GitHub's
[private vulnerability reporting](https://github.com/The-Tech-Margin/brand-helper/security/advisories/new)).
Include reproduction steps, affected paths, and impact. You can expect an acknowledgement within a few
business days, and we'll keep you updated as we work on a fix.

## Scope

This is a portfolio/demo application. The security model:

- **Secrets** live only in deployment env vars and a gitignored `.env.local`; only `.env.example`
  (no real values) is committed. Server-only accessors are isolated in `lib/env.ts` behind
  `import 'server-only'`, so secrets never reach the browser bundle.
- **Row-Level Security** isolates every row per user. The Supabase service role is used server-side
  only and always sets `user_id` explicitly.
- **Auth** is enforced twice (proxy redirect + authoritative `getUser()` in the `(app)` layout), and
  login is rate-limited (DB-backed, hashed-IP key).
- **Image generation + AI edits** run server-side through the Vercel AI Gateway with a single
  `AI_GATEWAY_API_KEY` (never exposed to the browser). Creative image bytes are sent to the gateway
  for generation and in-editor edits; every editor/deliverable route authenticates and RLS-checks
  ownership before any service-role read. No AGPL/copyleft dependencies are vendored (the editor uses
  MIT-licensed Konva, not an external SDK).
- CI runs `npm audit --audit-level=high`, **gitleaks** secret scanning over full history, and
  regenerates an SBOM (`sbom.json`). Dependabot keeps dependencies patched.

If you fork and deploy this project, **rotate all keys** and use your own Supabase project.

## Supported versions

This project tracks `main`; fixes land there. There is no separate LTS branch.
