-- ACEMS relational schema based on project report workflows:
-- authentication, campaign management, contract lifecycle,
-- rule evaluation, decisions, notifications, and audit trail.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('brand', 'creator', 'admin')),
  password_hash TEXT,
  avatar_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash TEXT NOT NULL UNIQUE,
  user_agent TEXT,
  ip_address INET,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  brand_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  goal TEXT,
  target_audience TEXT,
  description TEXT NOT NULL,
  deliverables_summary TEXT,
  timeline_summary TEXT,
  platform TEXT NOT NULL,
  budget NUMERIC(12, 2) NOT NULL CHECK (budget >= 0),
  budget_min NUMERIC(12, 2) CHECK (budget_min >= 0),
  budget_max NUMERIC(12, 2) CHECK (budget_max >= 0),
  content_rights TEXT,
  deadline DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_requirements (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  requirement_text TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS creator_matches (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_score NUMERIC(5, 2) NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  rationale JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, creator_id)
);

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  brand_id TEXT NOT NULL REFERENCES users(id),
  creator_id TEXT NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'accepted', 'locked', 'executed', 'completed', 'disputed', 'cancelled')),
  payment_amount NUMERIC(12, 2) NOT NULL CHECK (payment_amount >= 0),
  contract_deadline DATE,
  notes TEXT,
  terms_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (brand_id <> creator_id)
);

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

CREATE TABLE IF NOT EXISTS campaign_application_events (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES campaign_applications(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_deliverables (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  platform TEXT NOT NULL,
  deadline DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'verified', 'rejected')),
  submitted_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  evidence_url TEXT,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_rules (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('deliverable', 'deadline', 'compliance')),
  description TEXT NOT NULL,
  passed BOOLEAN,
  evaluation_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decision_evaluations (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('success', 'failure')),
  confidence_score NUMERIC(4, 3) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  processing_time_ms INT CHECK (processing_time_ms >= 0),
  trace JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  evaluated_by TEXT NOT NULL DEFAULT 'decision_engine'
);

CREATE TABLE IF NOT EXISTS decision_reasons (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decision_evaluations(id) ON DELETE CASCADE,
  reason_text TEXT NOT NULL,
  is_blocker BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
  decision_id TEXT REFERENCES decision_evaluations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS contract_events (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contract_documents (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  source_file_name TEXT NOT NULL,
  source_mime_type TEXT,
  source_sha256 TEXT NOT NULL,
  extracted_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  brand_signed_at TIMESTAMPTZ,
  brand_signed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  creator_signed_at TIMESTAMPTZ,
  creator_signed_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  creator_final_submission_url TEXT,
  creator_final_submitted_at TIMESTAMPTZ,
  locked_terms_hash TEXT,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_campaigns_brand ON campaigns(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_campaign ON campaign_applications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_creator ON campaign_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_brand ON campaign_applications(brand_id);
CREATE INDEX IF NOT EXISTS idx_campaign_applications_status ON campaign_applications(status);
CREATE INDEX IF NOT EXISTS idx_campaign_application_events_application ON campaign_application_events(application_id);
CREATE INDEX IF NOT EXISTS idx_contracts_campaign ON contracts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_contracts_brand ON contracts(brand_id);
CREATE INDEX IF NOT EXISTS idx_contracts_creator ON contracts(creator_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_contract ON contract_deliverables(contract_id);
CREATE INDEX IF NOT EXISTS idx_rules_contract ON contract_rules(contract_id);
CREATE INDEX IF NOT EXISTS idx_decisions_contract ON decision_evaluations(contract_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_contract_events_contract ON contract_events(contract_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_contract_documents_contract ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_source_sha ON contract_documents(source_sha256);
