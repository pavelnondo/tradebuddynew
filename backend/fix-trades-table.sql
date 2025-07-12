-- Fix trades table - add missing columns
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS pnl DECIMAL(10,2);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS emotion VARCHAR(50);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS setup VARCHAR(100);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS execution_quality VARCHAR(10);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS checklist_id INTEGER REFERENCES checklists(id) ON DELETE SET NULL;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS checklist_completed JSONB;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS screenshot VARCHAR(500);

-- Create setups table for saving trading setups
CREATE TABLE IF NOT EXISTS trading_setups (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    setup_type VARCHAR(50),
    entry_criteria TEXT,
    exit_criteria TEXT,
    risk_management TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for setups
CREATE INDEX IF NOT EXISTS idx_trading_setups_user_id ON trading_setups(user_id);

-- Create trigger for setups updated_at
CREATE TRIGGER update_trading_setups_updated_at 
    BEFORE UPDATE ON trading_setups 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify the changes
\d trades 