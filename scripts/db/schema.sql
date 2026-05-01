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
-- Account requests (developer onboarding)
-- =========================================
CREATE TABLE IF NOT EXISTS account_requests (
  id BIGSERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  requested_role TEXT NOT NULL DEFAULT 'user',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  decision_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_requests_status_created
  ON account_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_account_requests_email
  ON account_requests (lower(email));

-- =========================================
-- System settings
-- =========================================
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================
-- Audit logs
-- =========================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_user_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
  actor_user_name TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action, created_at DESC);

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
VALUES ('admin', 'System Admin', 'admin', crypt('admin123', gen_salt('bf')), false)
ON CONFLICT (user_name) DO UPDATE SET password_hash = crypt('admin123', gen_salt('bf')), is_temp_pass = false;

INSERT INTO app_settings (key, value)
VALUES ('maintenance_mode', 'false')
ON CONFLICT (key) DO NOTHING;

COMMIT;
