CREATE TABLE IF NOT EXISTS contract_documents (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  source_file_name TEXT NOT NULL,
  source_mime_type TEXT,
  source_sha256 TEXT NOT NULL,
  extracted_terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  locked_terms_hash TEXT,
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_contract_documents_contract ON contract_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_documents_source_sha ON contract_documents(source_sha256);
