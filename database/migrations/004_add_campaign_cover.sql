ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS highlight_color TEXT;
