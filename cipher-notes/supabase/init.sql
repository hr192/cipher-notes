-- Supabase / Postgres initialization script for Cipher Notes
CREATE TABLE IF NOT EXISTS pastes (
  id UUID PRIMARY KEY,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  expiry_time TIMESTAMP WITH TIME ZONE,
  auto_delete BOOLEAN DEFAULT false,
  owned_by VARCHAR(255),
  ip_address VARCHAR(255),
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_pastes_expiry ON pastes (expiry_time);
CREATE INDEX IF NOT EXISTS idx_pastes_owner ON pastes (owned_by);
