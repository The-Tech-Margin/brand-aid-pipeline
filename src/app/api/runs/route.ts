// POST /api/runs — validate a brief, persist the campaign + run, and launch it.
// Inline mode finishes the whole run in one background task; chunked mode kicks
// the first per-product step, which self-chains. Returns the runId immediately so
// the client can navigate to the live report.
import { after } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { validateBrief } from '@/features/brief/parse'
import { buildRunDeps } from '@/features/pipeline/deps'
import { chooseRunMode, startRun, stepRun } from '@/features/pipeline/chunked'
import { triggerStep } from '@/features/pipeline/step-trigger'
import type { RunMode } from '@/types/database'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: Request): Promise<Response> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: { brief?: unknown; mode?: unknown }
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validateBrief(payload.brief)
  if (!validation.ok || !validation.brief) {
    return Response.json({ error: 'Invalid brief', details: validation.errors }, { status: 400 })
  }
  const brief = validation.brief
  const mode: RunMode =
    payload.mode === 'inline' || payload.mode === 'chunked' ? payload.mode : chooseRunMode(brief)

  const deps = buildRunDeps(user.id, brief)
  const { runId, campaignId } = await startRun(brief, deps, mode)

  if (mode === 'inline') {
    after(async () => {
      try {
        let done = false
        while (!done) done = (await stepRun(deps, runId)).done
      } catch {
        // Best-effort: don't leave the run stuck "running" if a step throws.
        await deps.persistence
          .finalizeRun(runId, 'failed', {
            products: brief.products.length,
            generated: 0,
            reused: 0,
            creatives: 0,
            failedProducts: brief.products.length,
            compliancePassRate: 0,
            localized: false,
            durationMs: 0,
          })
          .catch(() => {})
      }
    })
  } else {
    const { origin } = new URL(req.url)
    after(() => triggerStep(origin, runId))
  }

  return Response.json({ runId, campaignId, mode }, { status: 202 })
}
