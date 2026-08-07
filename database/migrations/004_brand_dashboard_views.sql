-- Database Migration 004: Brand Dashboard Real-time Metrics & Risk Views

-- Create activity_stream table if it doesn't exist
CREATE TABLE IF NOT EXISTS activity_stream (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  actor VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  badge VARCHAR(50) DEFAULT 'NEUTRAL',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for high-velocity dashboard query execution
CREATE INDEX IF NOT EXISTS idx_activity_stream_org_date ON activity_stream(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- View for Realtime Brand Execution Aggregates
CREATE OR REPLACE VIEW view_brand_dashboard_summary AS
SELECT 
  c.organization_id,
  COUNT(CASE WHEN c.status = 'EXECUTING' THEN 1 END) AS executing_count,
  COALESCE(SUM(CASE WHEN c.status = 'EXECUTING' THEN c.amount END), 0) AS total_escrow_locked,
  COUNT(CASE WHEN c.status IN ('PENDING_ACCEPTANCE', 'AWAITING_CREATOR_REVIEW') THEN 1 END) AS awaiting_acceptance_count,
  COUNT(CASE WHEN c.status = 'SIGNED_CONTRACT_SUBMITTED' THEN 1 END) AS signed_pending_lock_count,
  COALESCE(SUM(CASE WHEN c.status = 'SIGNED_CONTRACT_SUBMITTED' THEN c.amount END), 0) AS signed_pending_escrow,
  COUNT(CASE WHEN c.status = 'FAILED' THEN 1 END) AS active_breaches
FROM contracts c
GROUP BY c.organization_id;
