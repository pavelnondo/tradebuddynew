-- Migration to rename trading_accounts to journals
-- This ensures all trade data is stored within journals

-- First, rename the table
ALTER TABLE trading_accounts RENAME TO journals;

-- Update the trades table foreign key reference
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_account_id_fkey;
ALTER TABLE trades RENAME COLUMN account_id TO journal_id;
ALTER TABLE trades ADD CONSTRAINT trades_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE;

-- Update performance_metrics table foreign key reference
ALTER TABLE performance_metrics DROP CONSTRAINT IF EXISTS performance_metrics_account_id_fkey;
ALTER TABLE performance_metrics RENAME COLUMN account_id TO journal_id;
ALTER TABLE performance_metrics ADD CONSTRAINT performance_metrics_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_trades_account_id;
CREATE INDEX idx_trades_journal_id ON trades(journal_id);

DROP INDEX IF EXISTS idx_performance_metrics_user_period;
CREATE INDEX idx_performance_metrics_user_period ON performance_metrics(user_id, period_type, period_start);

-- Update the trigger function to use journals
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Recreate triggers with new table name
DROP TRIGGER IF EXISTS update_trading_accounts_updated_at ON journals;
CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON journals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure all users have a default "Journal 1" if they don't have any journals
INSERT INTO journals (user_id, name, account_type, initial_balance, current_balance, currency, is_active, created_at, updated_at)
SELECT 
    u.id,
    'Journal 1',
    'paper',
    5000,
    5000,
    'USD',
    true,
    NOW(),
    NOW()
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM journals j WHERE j.user_id = u.id
);

-- Update any existing journals with generic names to be more descriptive
UPDATE journals 
SET name = 'Journal ' || ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at)
WHERE name IN ('Main Account', 'Account 1', 'Default Account', 'Trading Account');

-- Ensure only one journal per user is active
WITH ranked_journals AS (
    SELECT id, user_id, 
           ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) as rn
    FROM journals
)
UPDATE journals 
SET is_active = (rn = 1)
FROM ranked_journals r
WHERE journals.id = r.id;

-- Add a comment to the journals table
COMMENT ON TABLE journals IS 'Trading journals - each user can have multiple journals to track different trading strategies or time periods';
COMMENT ON COLUMN journals.name IS 'User-defined name for the journal (e.g., "Journal 1", "Scalping Journal", "Swing Trading")';
COMMENT ON COLUMN journals.account_type IS 'Type of trading: paper, live, or demo';
COMMENT ON COLUMN journals.is_active IS 'Only one journal per user can be active at a time';


