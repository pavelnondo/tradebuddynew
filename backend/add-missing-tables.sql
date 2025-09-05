-- Add missing tables for advanced features

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
CREATE INDEX IF NOT EXISTS idx_trading_goals_user_id ON trading_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_templates_user_id ON trade_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_trading_goals_updated_at BEFORE UPDATE ON trading_goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_templates_updated_at BEFORE UPDATE ON trade_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_performance_metrics_updated_at BEFORE UPDATE ON performance_metrics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tradebuddy_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tradebuddy_user;
