CREATE TABLE IF NOT EXISTS campaign_application_events (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_application_events_application ON campaign_application_events(application_id);

ALTER TABLE contract_documents
  ADD COLUMN IF NOT EXISTS brand_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS brand_signed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS creator_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS creator_signed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS creator_final_submission_url TEXT,
  ADD COLUMN IF NOT EXISTS creator_final_submitted_at TIMESTAMPTZ;
