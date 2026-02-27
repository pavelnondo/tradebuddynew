-- Local PostgreSQL Database Setup for TradeBuddy
-- Run this script to set up the complete database schema locally

-- Create database if it doesn't exist (run this as postgres superuser)
-- CREATE DATABASE tradebuddy;

-- Connect to the tradebuddy database and run the following:

-- Enable UUID extension for better ID management
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with Apple-level security and efficiency
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- Trading journals (renamed from trading_accounts)
CREATE TABLE IF NOT EXISTS journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'paper', 'live', 'demo'
    broker VARCHAR(100),
    initial_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    is_blown BOOLEAN DEFAULT false,
    is_passed BOOLEAN DEFAULT false,
    blown_at TIMESTAMP WITH TIME ZONE,
    passed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Efficient trades table with optimized structure
CREATE TABLE IF NOT EXISTS trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    
    -- Core trade data
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(20) NOT NULL, -- 'long', 'short', 'scalp', 'swing'
    direction VARCHAR(10) NOT NULL, -- 'buy', 'sell'
    type VARCHAR(10), -- Additional type field for compatibility
    
    -- Pricing and sizing
    entry_price DECIMAL(15,6) NOT NULL,
    exit_price DECIMAL(15,6),
    quantity DECIMAL(15,6) NOT NULL,
    position_size DECIMAL(15,2),
    
    -- Timing
    entry_time VARCHAR(50), -- Stored as string for compatibility
    exit_time VARCHAR(50), -- Stored as string for compatibility
    duration INTEGER, -- Duration in minutes
    
    -- Psychology and analysis
    emotion VARCHAR(50),
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
    execution_quality INTEGER CHECK (execution_quality >= 1 AND execution_quality <= 10),
    setup_type VARCHAR(100),
    market_condition VARCHAR(100),
    
    -- Results
    pnl DECIMAL(15,2),
    pnl_percentage DECIMAL(8,4),
    commission DECIMAL(15,2),
    fees DECIMAL(15,2),
    
    -- Additional data
    notes TEXT,
    tags TEXT,
    screenshot_url TEXT,
    checklist_id UUID,
    checklist_items JSONB,
    during_checklist_id UUID,
    during_checklist_items JSONB,
    post_checklist_id UUID,
    post_checklist_items JSONB,
    voice_note_urls JSONB DEFAULT '[]',
    
    -- Risk architecture (nullable for backward compatibility)
    planned_risk_amount DECIMAL(15,6),
    planned_risk_percent DECIMAL(10,6),
    stop_loss_price DECIMAL(15,6),
    take_profit_price DECIMAL(15,6),
    planned_rr DECIMAL(15,6),
    actual_rr DECIMAL(15,6),
    r_multiple DECIMAL(15,6),
    trade_number_of_day INTEGER,
    session VARCHAR(20),
    risk_consistency_flag BOOLEAN,
    checklist_completion_percent DECIMAL(5,2),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    initial_balance DECIMAL(15,2) DEFAULT 10000.00,
    currency VARCHAR(3) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklists table (pre, during, post trade types)
CREATE TABLE IF NOT EXISTS checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) DEFAULT 'pre',
    items JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade templates table
CREATE TABLE IF NOT EXISTS trade_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    symbol VARCHAR(20),
    trade_type VARCHAR(20),
    setup_type VARCHAR(100),
    market_condition VARCHAR(100),
    confidence_level INTEGER,
    notes TEXT,
    tags JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance metrics table (for analytics)
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2) DEFAULT 0,
    total_pnl DECIMAL(15,2) DEFAULT 0,
    avg_win DECIMAL(15,2) DEFAULT 0,
    avg_loss DECIMAL(15,2) DEFAULT 0,
    profit_factor DECIMAL(8,2) DEFAULT 0,
    max_drawdown DECIMAL(15,2) DEFAULT 0,
    sharpe_ratio DECIMAL(8,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_active ON journals(is_active);

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_journal_id ON trades(journal_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_trade_type ON trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_trades_emotion ON trades(emotion);
CREATE INDEX IF NOT EXISTS idx_trades_pnl ON trades(pnl);
CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session);
CREATE INDEX IF NOT EXISTS idx_trades_trade_number_of_day ON trades(trade_number_of_day);
CREATE INDEX IF NOT EXISTS idx_trades_r_multiple ON trades(r_multiple);
CREATE INDEX IF NOT EXISTS idx_trades_planned_risk_percent ON trades(planned_risk_percent);
CREATE INDEX IF NOT EXISTS idx_trades_checklist_completion_percent ON trades(checklist_completion_percent);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_templates_user_id ON trade_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_period ON performance_metrics(user_id, period_type, period_start);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journals_updated_at ON journals;
CREATE TRIGGER update_journals_updated_at BEFORE UPDATE ON journals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trades_updated_at ON trades;
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_checklists_updated_at ON checklists;
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trade_templates_updated_at ON trade_templates;
CREATE TRIGGER update_trade_templates_updated_at BEFORE UPDATE ON trade_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_metrics_updated_at ON performance_metrics;
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'User accounts with authentication and profile information';
COMMENT ON TABLE journals IS 'Trading journals - each user can have multiple journals to track different trading strategies or time periods';
COMMENT ON TABLE trades IS 'Individual trade records with comprehensive tracking data';
COMMENT ON TABLE user_settings IS 'User preferences and default settings';
COMMENT ON TABLE checklists IS 'Pre-trade and post-trade checklists for systematic trading';
COMMENT ON TABLE trade_templates IS 'Reusable trade templates for common setups';
COMMENT ON TABLE performance_metrics IS 'Aggregated performance metrics for analytics and reporting';

-- Insert some sample data for testing (optional)
-- You can uncomment this section if you want sample data

/*
-- Sample user (password: 'password123' - change this!)
INSERT INTO users (email, password_hash, first_name, last_name) 
VALUES ('demo@tradebuddy.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2K', 'Demo', 'User')
ON CONFLICT (email) DO NOTHING;

-- Sample journal for demo user
INSERT INTO journals (user_id, name, account_type, initial_balance, current_balance, currency, is_active)
SELECT u.id, 'Demo Journal', 'paper', 10000, 10000, 'USD', true
FROM users u WHERE u.email = 'demo@tradebuddy.com'
ON CONFLICT DO NOTHING;
*/

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'TradeBuddy database schema created successfully!';
    RAISE NOTICE 'You can now start the application with: npm run dev';
END $$;

