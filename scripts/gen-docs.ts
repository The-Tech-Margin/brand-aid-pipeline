// Auto-generates the token tables in design-system.md from src/app/globals.css — the
// single runtime source of truth. `npm run docs:gen` rewrites the tables in place;
// `npm run docs:check` (--check) fails when the doc has drifted from the CSS, so
// CI catches a token edit that forgot to update the docs. Tables live between
// `<!-- gen:<name>:start -->` / `:end` markers; everything else is hand-authored.
import { readFileSync, writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'

const CSS_PATH = resolve('src/app/globals.css')
const DOC_PATH = resolve('design-system.md')
const PRETTIER = resolve('node_modules/.bin/prettier')

type Tokens = Record<string, string>

const SELECTORS = {
  brandedDark: "[data-theme='branded'][data-mode='dark']",
  brandedLight: "[data-theme='branded'][data-mode='light']",
  plainDark: "[data-theme='plain'][data-mode='dark']",
  plainLight: "[data-theme='plain'][data-mode='light']",
} as const
type SkinMode = keyof typeof SELECTORS

interface Row {
  token: string
  use: string
}

const SURFACES: Row[] = [
  { token: '--background', use: 'Page background' },
  { token: '--card', use: 'Cards, panels, modals' },
  { token: '--muted', use: 'Recessed areas, hovers' },
  { token: '--border', use: 'Hairlines, input borders' },
]

const TEXT: Row[] = [
  { token: '--foreground', use: 'Headings, body' },
  { token: '--muted-foreground', use: 'Labels, metadata, hints' },
]

const BRAND: Row[] = [
  { token: '--brand-pink', use: 'Primary CTAs, h1 accents' },
  { token: '--brand-lime', use: 'Success / pass status' },
  { token: '--brand-cyan', use: 'Focus ring, secondary' },
  { token: '--brand-hot-red', use: 'Errors / fail status / heart' },
  { token: '--brand-goldenrod', use: 'Warnings / warn status' },
]

function parseBlock(css: string, selector: string): Tokens {
  const esc = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${esc}\\s*\\{([^}]*)\\}`))
  if (!match) throw new Error(`Could not find CSS block for selector ${selector}`)
  const tokens: Tokens = {}
  for (const decl of match[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    tokens[`--${decl[1]}`] = decl[2].trim()
  }
  return tokens
}

function code(value: string): string {
  return `\`${value}\``
}

function cell(map: Tokens, token: string): string {
  const value = map[token]
  if (!value) throw new Error(`Missing ${token} in CSS block`)
  return code(value)
}

function renderTable(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(' | ')} |`
  const sep = `| ${headers.map(() => '---').join(' | ')} |`
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n')
  return [head, sep, body].join('\n')
}

function replaceBetween(doc: string, name: string, block: string): string {
  const start = `<!-- gen:${name}:start -->`
  const end = `<!-- gen:${name}:end -->`
  const re = new RegExp(`${start}[\\s\\S]*?${end}`)
  if (!re.test(doc)) throw new Error(`Marker "${name}" not found in ${DOC_PATH}`)
  return doc.replace(re, `${start}\n\n${block}\n\n${end}`)
}

function formatMarkdown(md: string): string {
  return execFileSync(PRETTIER, ['--parser', 'markdown'], { input: md, encoding: 'utf8' })
}

function main(): void {
  const css = readFileSync(CSS_PATH, 'utf8')
  const maps = Object.fromEntries(
    Object.entries(SELECTORS).map(([key, selector]) => [key, parseBlock(css, selector)]),
  ) as Record<SkinMode, Tokens>

  const surfaceCols = ['Token', 'Branded Dark', 'Branded Light', 'Plain Dark', 'Plain Light', 'Use']
  const fourMode = (rows: Row[]): string[][] =>
    rows.map(({ token, use }) => [
      code(token),
      cell(maps.brandedDark, token),
      cell(maps.brandedLight, token),
      cell(maps.plainDark, token),
      cell(maps.plainLight, token),
      use,
    ])

  const surfaces = renderTable(surfaceCols, fourMode(SURFACES))
  const text = renderTable(surfaceCols, fourMode(TEXT))
  const brand = renderTable(
    ['Token', 'Branded Dark', 'Branded Light', 'Plain (both)', 'Use'],
    BRAND.map(({ token, use }) => [
      code(token),
      cell(maps.brandedDark, token),
      cell(maps.brandedLight, token),
      'neutral gray',
      use,
    ]),
  )
  const radius = renderTable(
    ['Skin', code('--radius-token'), code('--radius-lg')],
    [
      ['branded', cell(maps.brandedDark, '--radius-token'), cell(maps.brandedDark, '--radius-lg')],
      ['plain', cell(maps.plainDark, '--radius-token'), cell(maps.plainDark, '--radius-lg')],
    ],
  )

  let doc = readFileSync(DOC_PATH, 'utf8')
  doc = replaceBetween(doc, 'surfaces', surfaces)
  doc = replaceBetween(doc, 'text', text)
  doc = replaceBetween(doc, 'brand', brand)
  doc = replaceBetween(doc, 'radius', radius)
  const formatted = formatMarkdown(doc)

  if (process.argv.includes('--check')) {
    if (formatted !== readFileSync(DOC_PATH, 'utf8')) {
      console.error(
        'design-system.md is out of sync with src/app/globals.css — run `npm run docs:gen`.',
      )
      process.exit(1)
    }
    console.log('design-system.md token tables are in sync with globals.css ✓')
    return
  }

  writeFileSync(DOC_PATH, formatted)
  console.log('Regenerated design-system.md token tables from globals.css ✓')
}

main()
