'use server'

// Destructive data-management actions for the reports area. Ownership is enforced by
// RLS (the campaigns_owner / runs_owner policies in 0001 — a delete can only ever
// affect the signed-in user's own rows); DB cascades remove children. Creative storage
// objects aren't FK-cascaded, so a campaign delete also clears them from the bucket.
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/services/supabase/server'
import { createSupabaseAdminClient } from '@/services/supabase/admin'
import { getMyMembership } from '@/features/members/data'
import { env } from '@/config/env'

export type DeleteResult = { ok: true } | { ok: false; error: string }

export async function deleteCampaignAction(campaignId: string): Promise<DeleteResult> {
  const membership = await getMyMembership()
  if (membership?.status !== 'active') return { ok: false, error: 'Not authorized' }
  if (!campaignId) return { ok: false, error: 'Missing campaign id' }

  const supabase = await createSupabaseServerClient()
  // RLS returns the row only if the signed-in user owns it.
  const { data: owned } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .maybeSingle()
  if (!owned) return { ok: false, error: 'Campaign not found' }

  // Remove the campaign's creative objects from storage before the rows cascade away.
  const { data: assets } = await supabase
    .from('assets')
    .select('storage_path')
    .eq('campaign_id', campaignId)
  const paths = (assets ?? []).map((a) => a.storage_path).filter((p): p is string => !!p)
  if (paths.length > 0) {
    const admin = createSupabaseAdminClient()
    const { error: storageError } = await admin.storage.from(env.storageBucket()).remove(paths)
    // Stop before the DB delete if storage cleanup failed — otherwise the cascading
    // row deletes would orphan these objects in the bucket. Leaving everything intact
    // lets the user retry.
    if (storageError) {
      return { ok: false, error: 'Could not remove the campaign’s files — nothing was deleted' }
    }
  }

  // DB cascades products → assets → compliance_results, plus runs → run_events.
  const { error } = await supabase.from('campaigns').delete().eq('id', campaignId)
  if (error) return { ok: false, error: 'Could not delete campaign' }

  revalidatePath('/reports')
  revalidatePath('/dashboard')
  return { ok: true }
}

export async function deleteRunAction(runId: string): Promise<DeleteResult> {
  const membership = await getMyMembership()
  if (membership?.status !== 'active') return { ok: false, error: 'Not authorized' }
  if (!runId) return { ok: false, error: 'Missing run id' }

  // Deletes the run and (via cascade) its event log; the campaign and its creatives
  // stay. RLS confines the delete to the owner's own run.
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('runs').delete().eq('id', runId)
  if (error) return { ok: false, error: 'Could not delete run' }

  revalidatePath('/reports')
  revalidatePath('/dashboard')
  return { ok: true }
}
