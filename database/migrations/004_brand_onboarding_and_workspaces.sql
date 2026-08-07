-- Migration: 004_brand_onboarding_and_workspaces.sql

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  industry TEXT,
  company_size TEXT,
  website TEXT,
  bio TEXT,
  linkedin_url TEXT,
  hq_location TEXT,
  onboarding_status TEXT DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, COMPLETED
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin', -- admin, member, finance
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (workspace_id, user_id)
);

-- Add onboarding_step to users table to track where they are in the multi-step flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_linked BOOLEAN DEFAULT FALSE;
