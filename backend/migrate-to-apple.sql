-- Safe Migration to Apple-Inspired Schema
-- This script preserves existing data while adding new features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create new tables without dropping existing ones
-- Users table upgrade (add new fields if they don't exist)
DO $$ 
BEGIN
    -- Add new columns to users table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE users ADD COLUMN avatar_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'preferences') THEN
        ALTER TABLE users ADD COLUMN preferences JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Create trading_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL DEFAULT 'Main Account',
    account_type VARCHAR(50) NOT NULL DEFAULT 'live',
    broker VARCHAR(100) DEFAULT 'Unknown',
    initial_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default account for existing users
INSERT INTO trading_accounts (user_id, name, account_type, broker)
SELECT DISTINCT id, 'Main Account', 'live', 'Unknown'
FROM users
WHERE NOT EXISTS (SELECT 1 FROM trading_accounts WHERE user_id = users.id);

-- Upgrade trades table with new columns
DO $$ 
BEGIN
    -- Add new columns to trades table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'account_id') THEN
        ALTER TABLE trades ADD COLUMN account_id UUID;
        -- Link existing trades to default account
        UPDATE trades SET account_id = (
            SELECT ta.id FROM trading_accounts ta 
            WHERE ta.user_id = trades.user_id 
            LIMIT 1
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'trade_type') THEN
        ALTER TABLE trades ADD COLUMN trade_type VARCHAR(20) DEFAULT 'swing';
        -- Map existing 'type' to 'trade_type'
        UPDATE trades SET trade_type = 
            CASE 
                WHEN type = 'buy' THEN 'long'
                WHEN type = 'sell' THEN 'short'
                ELSE 'swing'
            END;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'direction') THEN
        ALTER TABLE trades ADD COLUMN direction VARCHAR(10);
        -- Map existing 'type' to 'direction'
        UPDATE trades SET direction = type;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'position_size') THEN
        ALTER TABLE trades ADD COLUMN position_size DECIMAL(15,2);
        -- Calculate position size from existing data
        UPDATE trades SET position_size = COALESCE(entry_price * quantity, 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'pnl_percentage') THEN
        ALTER TABLE trades ADD COLUMN pnl_percentage DECIMAL(8,4);
        -- Calculate PnL percentage
        UPDATE trades SET pnl_percentage = 
            CASE 
                WHEN entry_price > 0 AND exit_price > 0 THEN 
                    ((exit_price - entry_price) / entry_price) * 100
                ELSE NULL
            END;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'commission') THEN
        ALTER TABLE trades ADD COLUMN commission DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'fees') THEN
        ALTER TABLE trades ADD COLUMN fees DECIMAL(10,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'confidence_level') THEN
        ALTER TABLE trades ADD COLUMN confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'setup_type') THEN
        ALTER TABLE trades ADD COLUMN setup_type VARCHAR(100);
        -- Map existing 'setup' to 'setup_type'
        UPDATE trades SET setup_type = setup;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'market_condition') THEN
        ALTER TABLE trades ADD COLUMN market_condition VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'tags') THEN
        ALTER TABLE trades ADD COLUMN tags TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'screenshot_url') THEN
        ALTER TABLE trades ADD COLUMN screenshot_url TEXT;
        -- Map existing 'screenshot' to 'screenshot_url'
        UPDATE trades SET screenshot_url = screenshot;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'is_closed') THEN
        ALTER TABLE trades ADD COLUMN is_closed BOOLEAN DEFAULT false;
        -- Set is_closed based on exit_price
        UPDATE trades SET is_closed = (exit_price IS NOT NULL);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'updated_at') THEN
        ALTER TABLE trades ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trades' AND column_name = 'duration_minutes') THEN
        ALTER TABLE trades ADD COLUMN duration_minutes INTEGER;
        -- Calculate duration from existing data
        UPDATE trades SET duration_minutes = 
            CASE 
                WHEN entry_time IS NOT NULL AND exit_time IS NOT NULL THEN
                    EXTRACT(EPOCH FROM (exit_time - entry_time)) / 60
                ELSE NULL
            END;
    END IF;
END $$;

-- Create new tables for enhanced features
CREATE TABLE IF NOT EXISTS ai_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id BIGINT REFERENCES trades(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voice_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS voice_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    duration_seconds INTEGER,
    transcription TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create document_uploads table if it doesn't exist
CREATE TABLE IF NOT EXISTS document_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create processing_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS processing_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create screenshots table if it doesn't exist
CREATE TABLE IF NOT EXISTS screenshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    trade_id BIGINT REFERENCES trades(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dialogs table if it doesn't exist
CREATE TABLE IF NOT EXISTS dialogs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    dialog_type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create telegram_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS telegram_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id BIGINT UNIQUE NOT NULL,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(100),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create strategy table if it doesn't exist
CREATE TABLE IF NOT EXISTS strategy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rules JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_user_id_account_id ON trades(user_id, account_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_emotion ON trades(emotion);
CREATE INDEX IF NOT EXISTS idx_trades_setup_type ON trades(setup_type);

-- Update existing data to use new schema
UPDATE trades SET 
    trade_type = COALESCE(trade_type, 'swing'),
    direction = COALESCE(direction, type),
    position_size = COALESCE(position_size, entry_price * COALESCE(quantity, 1)),
    is_closed = COALESCE(is_closed, exit_price IS NOT NULL)
WHERE trade_type IS NULL OR direction IS NULL OR position_size IS NULL OR is_closed IS NULL;

-- Create a view for backward compatibility
CREATE OR REPLACE VIEW trades_compat AS
SELECT 
    id, user_id, symbol, type, entry_price, exit_price, quantity, pnl, notes, 
    emotion, setup, created_at, processing_id, checklist_id, checklist_completed,
    entry_time, exit_time, execution_quality, duration, screenshot,
    -- New fields
    account_id, trade_type, direction, position_size, pnl_percentage,
    commission, fees, confidence_level, setup_type, market_condition,
    tags, screenshot_url, is_closed, updated_at, duration_minutes
FROM trades;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradebuddy_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradebuddy_user;

-- Success message
SELECT 'Migration to Apple-inspired schema completed successfully!' as status;
