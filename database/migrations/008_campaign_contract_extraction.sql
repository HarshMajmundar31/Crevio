ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contract_file_name TEXT;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contract_extracted_terms JSONB DEFAULT '{}'::jsonb;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contract_raw_text TEXT;
