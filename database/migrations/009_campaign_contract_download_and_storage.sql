-- Migration 009: Campaign Contract Storage and Download Support

ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS contract_file_path TEXT,
ADD COLUMN IF NOT EXISTS contract_file_mime TEXT DEFAULT 'application/pdf',
ADD COLUMN IF NOT EXISTS contract_file_data TEXT,
ADD COLUMN IF NOT EXISTS creator_signed_contract_path TEXT,
ADD COLUMN IF NOT EXISTS creator_signed_contract_name TEXT;

-- Also add signed contract support to campaign_applications
ALTER TABLE campaign_applications
ADD COLUMN IF NOT EXISTS signed_contract_path TEXT,
ADD COLUMN IF NOT EXISTS signed_contract_name TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE;
