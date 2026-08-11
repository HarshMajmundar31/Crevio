-- Migration 007: Create social_accounts table for Instagram Connect & future platforms

CREATE TABLE IF NOT EXISTS social_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'instagram',
  platform_user_id TEXT,
  username TEXT,
  display_name TEXT,
  profile_picture_url TEXT,
  account_type TEXT,
  followers_count INT DEFAULT 0,
  media_count INT DEFAULT 0,
  access_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  needs_reconnect BOOLEAN DEFAULT FALSE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_platform UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_social_accounts_user_platform ON social_accounts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_accounts_expires ON social_accounts(token_expires_at);
