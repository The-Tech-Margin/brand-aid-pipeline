// GET /api/runs/[runId]/events?since=<iso> — run status, totals and new log events.
// Polled by the run report for live progress. RLS scopes run_events to the owner.
import { createSupabaseServerClient } from '@/services/supabase/server'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ runId: string }> },
): Promise<Response> {
  const { runId } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const since = new URL(req.url).searchParams.get('since')
  let query = supabase
    .from('run_events')
    .select('id, level, stage, message, created_at')
    .eq('run_id', runId)
    .order('created_at', { ascending: true })
    .limit(500)
  if (since) query = query.gt('created_at', since)

  const { data: events } = await query
  const { data: run } = await supabase
    .from('runs')
    .select('status, totals')
    .eq('id', runId)
    .single()

  return Response.json({
    status: run?.status ?? 'pending',
    totals: run?.totals ?? {},
    events: events ?? [],
  })
}
