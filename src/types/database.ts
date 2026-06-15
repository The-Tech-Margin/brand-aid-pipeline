// Hand-authored types for the brand_helper schema (mirrors supabase/migrations).
// Rows are snake_case (DB shape); domain code maps these to camelCase at the
// data-access boundary. Regenerate with `supabase gen types` once linked.

export type AssetKind = 'input' | 'hero' | 'creative'
export type AssetSource = 'reused' | 'generated'
export type RunStatus = 'pending' | 'running' | 'succeeded' | 'failed'
export type RunMode = 'inline' | 'chunked'
export type ComplianceStatus = 'pass' | 'warn' | 'fail'
export type EventLevel = 'debug' | 'info' | 'warn' | 'error'

export type CampaignRow = {
  id: string
  user_id: string
  name: string
  region: string
  audience: string
  message: string
  locale: string | null
  status: string
  brand_palette: string[] | null
  created_at: string
}

export type ProductRow = {
  id: string
  campaign_id: string
  name: string
  description: string
  slug: string
  input_assets: string[]
  created_at: string
}

export type AssetRow = {
  id: string
  campaign_id: string
  product_id: string | null
  kind: AssetKind
  aspect_ratio: string | null
  storage_path: string
  source: AssetSource | null
  variant: string | null
  width: number | null
  height: number | null
  created_at: string
}

export type RunRow = {
  id: string
  campaign_id: string
  user_id: string
  status: RunStatus
  totals: Record<string, unknown>
  brief: Record<string, unknown> | null
  mode: RunMode
  next_product_index: number
  started_at: string
  finished_at: string | null
}

export type RunEventRow = {
  id: string
  run_id: string
  level: EventLevel
  stage: string
  message: string
  meta: Record<string, unknown>
  created_at: string
}

export type ComplianceResultRow = {
  id: string
  asset_id: string
  check: string
  status: ComplianceStatus
  detail: string | null
  created_at: string
}

export type ThemeRow = {
  id: string
  user_id: string
  name: string
  tokens: Record<string, unknown>
  is_default: boolean
  created_at: string
}

export type BrandProfileRow = {
  user_id: string
  business_name: string | null
  logo_path: string | null
  display_font: string | null
  updated_at: string
}

export type AppSettingRow = {
  key: string
  value: Record<string, unknown>
  updated_by: string | null
  updated_at: string
}

export type LoginAttemptRow = {
  id: string
  attempt_key: string
  window_start: string
  count: number
  created_at: string
}

export type AdminAllowlistRow = {
  email: string
  note: string | null
  created_at: string
}

export type MemberRole = 'visitor' | 'admin'
export type MemberStatus = 'invited' | 'active' | 'revoked'

export type MemberRow = {
  id: string
  email: string
  user_id: string | null
  role: MemberRole
  status: MemberStatus
  invited_by: string | null
  full_name: string | null
  organization: string | null
  created_at: string
  activated_at: string | null
}

export type AccessRequestStatus = 'pending' | 'approved' | 'denied'

export type AccessRequestRow = {
  id: string
  name: string
  organization: string
  email: string
  status: AccessRequestStatus
  created_at: string
  reviewed_by: string | null
  reviewed_at: string | null
}

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  brand_helper: {
    Tables: {
      campaigns: Table<CampaignRow>
      products: Table<ProductRow>
      assets: Table<AssetRow>
      runs: Table<RunRow>
      run_events: Table<RunEventRow>
      compliance_results: Table<ComplianceResultRow>
      themes: Table<ThemeRow>
      brand_profiles: Table<BrandProfileRow>
      app_settings: Table<AppSettingRow>
      login_attempts: Table<LoginAttemptRow>
      members: Table<MemberRow>
      access_requests: Table<AccessRequestRow>
      admin_allowlist: Table<AdminAllowlistRow>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
