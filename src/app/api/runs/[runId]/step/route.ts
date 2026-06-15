// POST /api/runs/[runId]/step — process exactly one product of a chunked run, then
// self-chain to the next. Authenticated by an internal run token (HMAC of the
// runId), not user cookies, so it can be triggered server-to-server.
import { after } from 'next/server'
import { verifyRunToken } from '@/features/pipeline/run-token'
import { triggerStep } from '@/features/pipeline/step-trigger'
import { stepRun } from '@/features/pipeline/chunked'
import { buildRunDeps } from '@/features/pipeline/deps'
import { SupabasePersistence } from '@/features/pipeline/supabase-persistence'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
): Promise<Response> {
  const { runId } = await params
  if (!verifyRunToken(runId, req.headers.get('x-run-token'))) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const state = await new SupabasePersistence().getRunState(runId)
  if (!state) return Response.json({ error: 'Run not found' }, { status: 404 })

  const deps = buildRunDeps(state.userId, state.brief)
  const result = await stepRun(deps, runId, state)
  if (!result.done) {
    const { origin } = new URL(req.url)
    after(() => triggerStep(origin, runId))
  }
  return Response.json(result)
}
