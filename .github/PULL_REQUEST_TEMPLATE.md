## What & why

<!-- What does this change, and why? Link any related issue (e.g. Closes #123). -->

## Changes

-

## Checklist

- [ ] Branched off `main`; scope is focused
- [ ] Ran on **Node 20** (`nvm use`): `lint`, `format:check`, `docs:check`, `typecheck`, `test` — all green
- [ ] If `src/app/globals.css` tokens changed, ran `npm run docs:gen`
- [ ] No secrets committed; no hardcoded hex (colors via `var(--*)` tokens)
- [ ] **Accessible**: keyboard-reachable, controls labelled, no `jsx-a11y` / axe regressions (see [ACCESSIBILITY.md](../ACCESSIBILITY.md))
- [ ] Docs updated if behavior or setup changed
