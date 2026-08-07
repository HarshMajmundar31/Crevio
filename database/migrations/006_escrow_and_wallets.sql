-- database/migrations/006_escrow_and_wallets.sql

-- 1. Create User Wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  available_balance NUMERIC(12, 2) NOT NULL DEFAULT 100000.00 CHECK (available_balance >= 0), -- Seeding everyone with 100,000 Play INR!
  pending_escrow_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (pending_escrow_balance >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

-- 2. Create Escrow holdings table
CREATE TABLE IF NOT EXISTS escrow_holdings (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES campaigns(id),
  brand_id TEXT NOT NULL REFERENCES users(id),
  creator_id TEXT NOT NULL REFERENCES users(id),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('awaiting_deposit', 'held', 'released', 'refunded', 'disputed')),
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  released_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create wallet transactions log table
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT NOT NULL REFERENCES user_wallets(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL, -- Credit (+), Debit (-)
  txn_type TEXT NOT NULL CHECK (txn_type IN ('seed', 'deposit', 'withdrawal', 'escrow_debit', 'escrow_credit', 'escrow_refund')),
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
  description TEXT NOT NULL,
  reference_escrow_id TEXT REFERENCES escrow_holdings(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for maximum speed
CREATE INDEX IF NOT EXISTS idx_user_wallets_user ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holdings_contract ON escrow_holdings(contract_id);
CREATE INDEX IF NOT EXISTS idx_escrow_holdings_status ON escrow_holdings(status);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_escrow_holdings_contract ON escrow_holdings(contract_id);
