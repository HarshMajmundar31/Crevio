-- Migration: 005_linkedin_enhanced_data.sql

-- Add a JSONB column to store the full LinkedIn profile payload
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_data JSONB DEFAULT '{}'::jsonb;

-- Add specific columns to workspaces that can be auto-filled from LinkedIn
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS linkedin_organization_id TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS linkedin_industry TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS linkedin_employee_count_range TEXT;
ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS linkedin_description TEXT;
