-- 011_proof_insights_and_photo_submissions.sql
-- Add photo submission and insights columns to campaign_proof_submissions

ALTER TABLE campaign_proof_submissions 
ADD COLUMN IF NOT EXISTS insights_image_path TEXT,
ADD COLUMN IF NOT EXISTS insights_image_name TEXT,
ADD COLUMN IF NOT EXISTS engagement_rate TEXT,
ADD COLUMN IF NOT EXISTS impressions_count TEXT,
ADD COLUMN IF NOT EXISTS reach_count TEXT,
ADD COLUMN IF NOT EXISTS likes_count TEXT,
ADD COLUMN IF NOT EXISTS comments_count TEXT,
ADD COLUMN IF NOT EXISTS shares_count TEXT,
ADD COLUMN IF NOT EXISTS saves_count TEXT,
ADD COLUMN IF NOT EXISTS overview_notes TEXT;
