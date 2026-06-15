// Fire-and-forget trigger for the next per-product step. Used by chunked runs to
// self-chain across serverless invocations; failures are swallowed because the
// pipeline records its own errors as run_events.
import 'server-only'
import { signRunToken } from './run-token'

export function triggerStep(origin: string, runId: string): void {
  void fetch(`${origin}/api/runs/${runId}/step`, {
    method: 'POST',
    headers: { 'x-run-token': signRunToken(runId) },
  }).catch(() => {})
}
