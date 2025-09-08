-- Create accounts table for multi-account support
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    initial_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_blown BOOLEAN NOT NULL DEFAULT false,
    is_passed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blown_at TIMESTAMP WITH TIME ZONE NULL,
    passed_at TIMESTAMP WITH TIME ZONE NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add is_passed column if it doesn't exist (for existing installations)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS is_passed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS passed_at TIMESTAMP WITH TIME ZONE NULL;

-- Add account_id column to trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);

-- Create a default account for existing users
INSERT INTO accounts (user_id, name, initial_balance, current_balance, is_active, is_blown, is_passed)
SELECT 
    u.id,
    'Account 1',
    COALESCE(us.initial_balance, 5000),
    COALESCE(us.initial_balance, 5000),
    true,
    false,
    false
FROM users u
LEFT JOIN user_settings us ON u.id = us.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM accounts a WHERE a.user_id = u.id
);

-- Update existing trades to belong to the default account
UPDATE trades 
SET account_id = (
    SELECT a.id 
    FROM accounts a 
    WHERE a.user_id = trades.user_id 
    AND a.is_active = true 
    LIMIT 1
)
WHERE account_id IS NULL;
