# Contributing to Brand Helper

Thanks for your interest in contributing! This project is a Next.js + Supabase creative-automation
pipeline. Bug reports, fixes, and well-scoped features are all welcome.

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

The toolchain needs **Node 20** (`.nvmrc`; `>=20.19`). Newer majors (21) break the test runner — see
the [dev runbook](runbook.html).

```bash
nvm use                      # Node 20
npm install
cp .env.example .env.local   # fill in your own Supabase project values
npm run dev                  # http://localhost:3000
```

Full local setup, a symptom → cause → fix table, and the going-public checklist live in
**[runbook.html](runbook.html)** — open it in a browser.

## Before you open a PR

Run the same gates CI runs, on Node 20:

```bash
npm run lint
npm run format:check    # or: npm run format  (to auto-fix)
npm run docs:check      # design-system.md tables in sync with src/app/globals.css
npm run typecheck
npm test
```

If you change a design token in `src/app/globals.css`, run `npm run docs:gen` to regenerate the
`design-system.md` tables (CI fails otherwise). See [design-system.md](design-system.md) for the
token model — **components consume `var(--*)` tokens; never hardcode hex.**

## Conventions

- **Branch** off `main` with a kebab-case name: `fix/...`, `feat/...`, `chore/...`, `docs/...`.
- **Commits**: imperative, capitalized subject, no trailing period — e.g.
  `Fix: login card radius`. Keep them focused.
- **TypeScript**: no default exports for components; explicit return types on exported functions;
  avoid `any`. Side effects belong in hooks, not component bodies.
- **Scope**: a bug fix shouldn't carry unrelated refactors. Three similar lines beat a premature
  abstraction.

## Reporting bugs & requesting features

Use the [issue templates](https://github.com/The-Tech-Margin/brand-helper/issues/new/choose). For
**security** issues, do **not** open a public issue — see [SECURITY.md](SECURITY.md).

## License

By contributing, you agree your contributions are licensed under the [MIT License](LICENSE).
