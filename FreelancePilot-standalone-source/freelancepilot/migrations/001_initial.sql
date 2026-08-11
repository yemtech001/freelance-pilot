CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS crm_clients (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 name TEXT NOT NULL,
 service TEXT NOT NULL DEFAULT '',
 value NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK(value>=0),
 status TEXT NOT NULL DEFAULT 'Lead' CHECK(status IN ('Lead','Active','Completed','Lost')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_clients_status ON crm_clients(status);
CREATE INDEX IF NOT EXISTS idx_crm_clients_created_at ON crm_clients(created_at DESC);
CREATE TABLE IF NOT EXISTS earnings (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 title TEXT NOT NULL,
 amount NUMERIC(12,2) NOT NULL CHECK(amount>0),
 platform TEXT NOT NULL DEFAULT 'Direct',
 date DATE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_earnings_created_at ON earnings(created_at DESC);