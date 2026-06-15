// CLI entrypoint — run the pipeline headless against Supabase + the AI Gateway:
//   npm run pipeline:run -- examples/brief.summer-glow.json
// Chunking only matters for serverless time limits, so the CLI runs the pipeline
// in-process (equivalent to inline) and prints the mode the web app would pick.
import { loadEnvConfig } from '@next/env'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { parseBrief } from '@/features/brief/parse'
import { buildRunDeps } from '@/features/pipeline/deps'
import { runCampaign } from '@/features/pipeline/run-campaign'
import { chooseRunMode } from '@/features/pipeline/chunked'
import { reportFromRunResult, reportToJson, reportToMarkdown } from '@/features/runs/report'

loadEnvConfig(process.cwd())

async function main() {
  const file = process.argv.slice(2).find((a) => !a.startsWith('--'))
  if (!file) {
    console.error('Usage: npm run pipeline:run -- <brief.json|brief.yaml>')
    process.exit(1)
  }

  const text = await readFile(resolve(process.cwd(), file), 'utf8')
  const parsed = parseBrief(text)
  if (!parsed.ok || !parsed.brief) {
    console.error(`Invalid brief:\n${(parsed.errors ?? []).join('\n')}`)
    process.exit(1)
  }
  const brief = parsed.brief

  const userId = process.env.PIPELINE_RUN_USER_ID
  if (!userId) {
    console.error(
      'Set PIPELINE_RUN_USER_ID to a seeded auth user UUID — RLS requires a real owner.',
    )
    process.exit(1)
  }

  console.log(
    `Running "${brief.campaign_name}" — web would auto-pick "${chooseRunMode(brief)}" mode…`,
  )
  const deps = buildRunDeps(userId, brief)
  const result = await runCampaign(brief, deps)

  const report = reportFromRunResult(result, brief.campaign_name)
  await mkdir(resolve(process.cwd(), 'reports'), { recursive: true })
  const base = resolve(process.cwd(), 'reports', result.campaignId)
  await writeFile(`${base}.json`, reportToJson(report))
  await writeFile(`${base}.md`, reportToMarkdown(report))

  console.log(
    `\n${result.status.toUpperCase()} — ${result.totals.creatives} creatives, ` +
      `${result.totals.compliancePassRate}% compliance pass`,
  )
  if (result.failedProducts.length) {
    console.log(`Failed products: ${result.failedProducts.map((f) => f.product).join(', ')}`)
  }
  console.log(`Report written to reports/${result.campaignId}.md`)
  process.exit(result.status === 'succeeded' ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
