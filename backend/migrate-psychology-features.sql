-- Migration script for Psychology Dashboard and Advanced Analytics features
-- This script adds missing columns and tables needed for the new features

-- First, let's check what columns exist and add missing ones
-- Add missing columns to trades table if they don't exist

-- Add account_id column (for multiple trading accounts)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'account_id') THEN
        ALTER TABLE trades ADD COLUMN account_id INTEGER;
    END IF;
END $$;

-- Add trade_type column (Long/Short/Scalp/Swing)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'trade_type') THEN
        ALTER TABLE trades ADD COLUMN trade_type VARCHAR(20);
    END IF;
END $$;

-- Add direction column (long/short)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'direction') THEN
        ALTER TABLE trades ADD COLUMN direction VARCHAR(10);
    END IF;
END $$;

-- Add position_size column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'position_size') THEN
        ALTER TABLE trades ADD COLUMN position_size DECIMAL(10, 4);
    END IF;
END $$;

-- Add confidence_level column (1-10 scale)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'confidence_level') THEN
        ALTER TABLE trades ADD COLUMN confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10);
    END IF;
END $$;

-- Add setup_type column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'setup_type') THEN
        ALTER TABLE trades ADD COLUMN setup_type VARCHAR(100);
    END IF;
END $$;

-- Add market_condition column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'market_condition') THEN
        ALTER TABLE trades ADD COLUMN market_condition VARCHAR(50);
    END IF;
END $$;

-- Add tags column (JSON array)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'tags') THEN
        ALTER TABLE trades ADD COLUMN tags JSONB;
    END IF;
END $$;

-- Add checklist_items column (JSON array)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'checklist_items') THEN
        ALTER TABLE trades ADD COLUMN checklist_items JSONB;
    END IF;
END $$;

-- Add screenshot_url column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'trades' AND column_name = 'screenshot_url') THEN
        ALTER TABLE trades ADD COLUMN screenshot_url VARCHAR(500);
    END IF;
END $$;

-- Update entry_time and exit_time to VARCHAR if they're still TIMESTAMP
-- (This was done in a previous migration, but let's ensure it's correct)
DO $$ 
BEGIN
    -- Check if entry_time is still TIMESTAMP and convert to VARCHAR
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'trades' AND column_name = 'entry_time' 
               AND data_type = 'timestamp without time zone') THEN
        
        -- Add new VARCHAR columns
        ALTER TABLE trades ADD COLUMN entry_time_new VARCHAR(25);
        ALTER TABLE trades ADD COLUMN exit_time_new VARCHAR(25);
        
        -- Copy data from old columns to new ones
        UPDATE trades SET 
            entry_time_new = to_char(entry_time, 'YYYY-MM-DD"T"HH24:MI'),
            exit_time_new = to_char(exit_time, 'YYYY-MM-DD"T"HH24:MI')
        WHERE entry_time IS NOT NULL AND exit_time IS NOT NULL;
        
        -- Drop old columns
        ALTER TABLE trades DROP COLUMN entry_time;
        ALTER TABLE trades DROP COLUMN exit_time;
        
        -- Rename new columns
        ALTER TABLE trades RENAME COLUMN entry_time_new TO entry_time;
        ALTER TABLE trades RENAME COLUMN exit_time_new TO exit_time;
        
        -- Set NOT NULL constraint
        ALTER TABLE trades ALTER COLUMN entry_time SET NOT NULL;
    END IF;
END $$;

-- Create trading_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS trading_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) DEFAULT 'paper',
    initial_balance DECIMAL(15, 2) DEFAULT 10000.00,
    current_balance DECIMAL(15, 2) DEFAULT 10000.00,
    currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    initial_balance DECIMAL(15, 2) DEFAULT 10000.00,
    currency VARCHAR(10) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    theme VARCHAR(20) DEFAULT 'light',
    notifications_enabled BOOLEAN DEFAULT true,
    email_notifications BOOLEAN DEFAULT true,
    telegram_notifications BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trading_goals table for goal tracking
CREATE TABLE IF NOT EXISTS trading_goals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'monthly_profit', 'win_rate', 'trades_per_day', etc.
    target_value DECIMAL(15, 2) NOT NULL,
    current_value DECIMAL(15, 2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create trade_templates table for quick trade entry
CREATE TABLE IF NOT EXISTS trade_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    symbol VARCHAR(20),
    trade_type VARCHAR(20),
    setup_type VARCHAR(100),
    default_emotion VARCHAR(50),
    default_confidence INTEGER CHECK (default_confidence >= 1 AND default_confidence <= 10),
    checklist_id INTEGER REFERENCES checklists(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create performance_metrics table for advanced analytics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    total_pnl DECIMAL(15, 2) DEFAULT 0,
    win_rate DECIMAL(5, 2) DEFAULT 0,
    profit_factor DECIMAL(5, 2) DEFAULT 0,
    max_drawdown DECIMAL(5, 2) DEFAULT 0,
    sharpe_ratio DECIMAL(5, 2) DEFAULT 0,
    avg_trade_duration INTEGER DEFAULT 0, -- in minutes
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, metric_date)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_account_id ON trades(account_id);
CREATE INDEX IF NOT EXISTS idx_trades_trade_type ON trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_trades_direction ON trades(direction);
CREATE INDEX IF NOT EXISTS idx_trades_confidence_level ON trades(confidence_level);
CREATE INDEX IF NOT EXISTS idx_trades_setup_type ON trades(setup_type);
CREATE INDEX IF NOT EXISTS idx_trades_market_condition ON trades(market_condition);
CREATE INDEX IF NOT EXISTS idx_trades_checklist_items ON trades USING GIN(checklist_items);
CREATE INDEX IF NOT EXISTS idx_trades_tags ON trades USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_trading_accounts_user_id ON trading_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_goals_user_id ON trading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_templates_user_id ON trade_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_goals_updated_at BEFORE UPDATE ON trading_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_templates_updated_at BEFORE UPDATE ON trade_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default trading account for existing users
INSERT INTO trading_accounts (user_id, name, account_type, initial_balance, current_balance)
SELECT 
    u.id, 
    'Main Account', 
    'paper', 
    10000.00, 
    10000.00
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM trading_accounts ta WHERE ta.user_id = u.id
);

-- Insert default user settings for existing users
INSERT INTO user_settings (user_id, initial_balance, currency, timezone, theme)
SELECT 
    u.id, 
    10000.00, 
    'USD', 
    'UTC', 
    'light'
FROM users u
WHERE NOT EXISTS (
    SELECT 1 FROM user_settings us WHERE us.user_id = u.id
);

-- Update existing trades to have default values for new columns
UPDATE trades SET 
    confidence_level = 5,
    trade_type = CASE 
        WHEN type = 'buy' THEN 'Long'
        WHEN type = 'sell' THEN 'Short'
        ELSE 'Long'
    END,
    direction = CASE 
        WHEN type = 'buy' THEN 'long'
        WHEN type = 'sell' THEN 'short'
        ELSE 'long'
    END
WHERE confidence_level IS NULL OR trade_type IS NULL OR direction IS NULL;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradebuddy_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradebuddy_user;

-- Print completion message
DO $$
BEGIN
    RAISE NOTICE 'Migration completed successfully! All psychology dashboard and analytics features are now supported.';
END $$;
