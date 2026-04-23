-- PostgreSQL setup for extracted selections persistence
-- Usage:
--   psql "postgresql://USER:PASSWORD@HOST:5432/DB_NAME" -f scripts/db/extracted-selections.sql

BEGIN;

CREATE TABLE IF NOT EXISTS extracted_selections (
  id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  headers JSONB NOT NULL,
  rows JSONB NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_extracted_selections_updated_at
  ON extracted_selections (updated_at DESC);

COMMIT;
