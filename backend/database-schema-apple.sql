-- Apple-Inspired Trading Journal Database Schema
-- Designed for efficiency, scalability, and clean data structure

-- Enable UUID extension for better ID management
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with Apple-level security and efficiency
CREATE TABLE users (
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

-- Trading accounts for multi-account support
CREATE TABLE trading_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- 'paper', 'live', 'demo'
    broker VARCHAR(100),
    initial_balance DECIMAL(15,2) DEFAULT 0,
    current_balance DECIMAL(15,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Efficient trades table with optimized structure
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
    
    -- Core trade data
    symbol VARCHAR(20) NOT NULL,
    trade_type VARCHAR(20) NOT NULL, -- 'long', 'short', 'scalp', 'swing'
    direction VARCHAR(10) NOT NULL, -- 'buy', 'sell'
    
    -- Pricing and sizing
    entry_price DECIMAL(15,6) NOT NULL,
    exit_price DECIMAL(15,6),
    quantity DECIMAL(15,6) NOT NULL,
    position_size DECIMAL(15,2) NOT NULL,
    
    -- Timing
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Results
    pnl DECIMAL(15,2),
    pnl_percentage DECIMAL(8,4),
    commission DECIMAL(10,2) DEFAULT 0,
    fees DECIMAL(10,2) DEFAULT 0,
    
    -- Psychology and analysis
    emotion VARCHAR(50),
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
    execution_quality INTEGER CHECK (execution_quality >= 1 AND execution_quality <= 10),
    
    -- Strategy and setup
    setup_type VARCHAR(100),
    market_condition VARCHAR(100),
    notes TEXT,
    
    -- Metadata
    tags TEXT[],
    screenshot_url TEXT,
    is_closed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trading checklists for discipline
CREATE TABLE checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trade checklist completion tracking
CREATE TABLE trade_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    checklist_id UUID REFERENCES checklists(id) ON DELETE CASCADE,
    completed_items JSONB NOT NULL, -- Store completion status
    completion_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance analytics for efficient querying
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES trading_accounts(id) ON DELETE CASCADE,
    
    -- Time period
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Metrics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    win_rate DECIMAL(5,2),
    total_pnl DECIMAL(15,2) DEFAULT 0,
    total_profit DECIMAL(15,2) DEFAULT 0,
    total_loss DECIMAL(15,2) DEFAULT 0,
    avg_win DECIMAL(15,2),
    avg_loss DECIMAL(15,2),
    profit_factor DECIMAL(8,4),
    max_drawdown DECIMAL(8,4),
    sharpe_ratio DECIMAL(8,4),
    
    -- Calculated at
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, account_id, period_type, period_start)
);

-- Market data for analysis
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open_price DECIMAL(15,6),
    high_price DECIMAL(15,6),
    low_price DECIMAL(15,6),
    close_price DECIMAL(15,6),
    volume DECIMAL(20,2),
    timeframe VARCHAR(10) NOT NULL, -- '1m', '5m', '15m', '1h', '4h', '1d'
    
    UNIQUE(symbol, timestamp, timeframe)
);

-- User sessions for security
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for optimal performance
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_entry_time ON trades(entry_time);
CREATE INDEX idx_trades_exit_time ON trades(exit_time);
CREATE INDEX idx_trades_emotion ON trades(emotion);
CREATE INDEX idx_trades_trade_type ON trades(trade_type);
CREATE INDEX idx_trades_pnl ON trades(pnl);

CREATE INDEX idx_performance_metrics_user_period ON performance_metrics(user_id, period_type, period_start);
CREATE INDEX idx_market_data_symbol_timeframe ON market_data(symbol, timeframe, timestamp);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- Full-text search indexes
CREATE INDEX idx_trades_notes_fts ON trades USING gin(to_tsvector('english', notes));
CREATE INDEX idx_trades_symbol_fts ON trades USING gin(to_tsvector('english', symbol));

-- Triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trading_accounts_updated_at BEFORE UPDATE ON trading_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_checklists_updated_at BEFORE UPDATE ON checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate trade P&L
CREATE OR REPLACE FUNCTION calculate_trade_pnl()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.exit_price IS NOT NULL AND NEW.quantity IS NOT NULL THEN
        IF NEW.direction = 'buy' THEN
            NEW.pnl = (NEW.exit_price - NEW.entry_price) * NEW.quantity;
        ELSE
            NEW.pnl = (NEW.entry_price - NEW.exit_price) * NEW.quantity;
        END IF;
        
        NEW.pnl_percentage = (NEW.pnl / (NEW.entry_price * NEW.quantity)) * 100;
        
        IF NEW.exit_time IS NOT NULL AND NEW.entry_time IS NOT NULL THEN
            NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.exit_time - NEW.entry_time)) / 60;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_trade_pnl_trigger BEFORE INSERT OR UPDATE ON trades FOR EACH ROW EXECUTE FUNCTION calculate_trade_pnl();

-- Views for common queries
CREATE VIEW trade_summary AS
SELECT 
    t.id,
    t.user_id,
    t.symbol,
    t.trade_type,
    t.direction,
    t.entry_price,
    t.exit_price,
    t.quantity,
    t.pnl,
    t.pnl_percentage,
    t.emotion,
    t.entry_time,
    t.exit_time,
    t.is_closed,
    u.email as user_email
FROM trades t
JOIN users u ON t.user_id = u.id;

-- Insert sample data for testing
INSERT INTO users (email, password_hash, first_name, last_name) VALUES
('demo@tradebuddy.com', '$2b$10$demo.hash.here', 'Demo', 'User');

INSERT INTO trading_accounts (user_id, name, account_type, initial_balance, current_balance) VALUES
((SELECT id FROM users WHERE email = 'demo@tradebuddy.com'), 'Main Account', 'paper', 10000, 10000);
