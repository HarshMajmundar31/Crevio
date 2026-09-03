-- 010_campaign_chat_and_proof_submissions.sql

-- 1. Extend campaign_applications for contract locking
ALTER TABLE campaign_applications 
ADD COLUMN IF NOT EXISTS is_contract_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS contract_locked_at TIMESTAMPTZ;

-- 2. Campaign Deliverables Proof Submissions
CREATE TABLE IF NOT EXISTS campaign_proof_submissions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  application_id TEXT REFERENCES campaign_applications(id) ON DELETE CASCADE,
  deliverable_title TEXT NOT NULL,
  live_url TEXT NOT NULL,
  description TEXT,
  attachment_path TEXT,
  attachment_name TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'revision_requested', 'rejected'
  brand_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proof_sub_campaign ON campaign_proof_submissions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_proof_sub_creator ON campaign_proof_submissions(creator_id);

-- 3. Campaign Negotiation & Collaboration Chat Messages
CREATE TABLE IF NOT EXISTS campaign_messages (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  sender_role TEXT DEFAULT 'creator',
  message TEXT NOT NULL,
  attachment_url TEXT,
  attachment_name TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_camp_msg_campaign ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_camp_msg_created ON campaign_messages(created_at ASC);
