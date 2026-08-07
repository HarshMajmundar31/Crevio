ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS goal TEXT,
  ADD COLUMN IF NOT EXISTS target_audience TEXT,
  ADD COLUMN IF NOT EXISTS deliverables_summary TEXT,
  ADD COLUMN IF NOT EXISTS timeline_summary TEXT,
  ADD COLUMN IF NOT EXISTS budget_min NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS budget_max NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS content_rights TEXT;

CREATE TABLE IF NOT EXISTS campaign_applications (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  brand_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pitch_message TEXT NOT NULL,
  platform_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  audience_location TEXT NOT NULL,
  audience_age_band TEXT NOT NULL,
  audience_niche TEXT NOT NULL,
  engagement_snapshot TEXT NOT NULL,
  past_work_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  proposed_deliverables TEXT NOT NULL,
  proposed_fee NUMERIC(12, 2) NOT NULL CHECK (proposed_fee >= 0),
  proposed_payment_model TEXT NOT NULL,
  earliest_start_date DATE NOT NULL,
  availability_notes TEXT NOT NULL,
  compliance_agreed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('submitted', 'shortlisted', 'interviewing', 'approved', 'rejected', 'withdrawn')),
  audience_fit_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  engagement_quality_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  content_quality_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  reliability_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  budget_fit_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  fit_score NUMERIC(5, 2) NOT NULL DEFAULT 0,
  brand_notes TEXT,
  negotiation_notes TEXT,
  usage_rights TEXT,
  exclusivity_terms TEXT,
  revision_terms TEXT,
  payout_terms TEXT,
  reviewed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  withdrawn_at TIMESTAMPTZ,
  contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_creator ON campaign_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_brand ON campaign_applications(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON campaign_applications(status);
