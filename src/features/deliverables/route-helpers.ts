// Shared auth + ownership gate for deliverable routes — one place for the
// "authenticate, then RLS-read the campaign brand fields" pattern, so each route is
// thin glue over the (tested) builders. RLS returns the row only to its owner.
import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/services/supabase/server'
import type { CampaignBrandFields } from './collect'

export type AuthorizedCampaign =
  | { ok: true; campaign: CampaignBrandFields }
  | { ok: false; response: Response }

export async function authorizeCampaign(campaignId: string): Promise<AuthorizedCampaign> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id, name, message, region, audience, locale, brand_palette')
    .eq('id', campaignId)
    .maybeSingle()
  if (!campaign) {
    return { ok: false, response: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  }

  return { ok: true, campaign }
}
