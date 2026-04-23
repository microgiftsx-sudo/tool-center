-- Unified PostgreSQL/Supabase schema for Tool Center
-- This is the single source of truth for database setup.
-- Usage:
--   psql "postgresql://USER:PASSWORD@HOST:5432/DB_NAME" -f scripts/db/schema.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================
-- Authentication
-- =========================================
CREATE TABLE IF NOT EXISTS app_users (
  id BIGSERIAL PRIMARY KEY,
  user_name TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  password_hash TEXT NOT NULL,
  is_temp_pass BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- =========================================
-- Excel Extracted Selections
-- =========================================
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

-- =========================================
-- Seed data (optional)
-- =========================================
-- username: admin
-- password: Admin@123
INSERT INTO app_users (user_name, full_name, role, password_hash, is_temp_pass)
VALUES ('admin', 'System Admin', 'admin', crypt('Admin@123', gen_salt('bf')), true)
ON CONFLICT (user_name) DO NOTHING;

COMMIT;
