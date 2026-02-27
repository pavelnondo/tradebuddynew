-- Fix TradeZella Schema Issues

-- Fix the trigger function for time extraction
CREATE OR REPLACE FUNCTION update_trade_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-calculate time fields (handle string timestamps)
    IF NEW.entry_time IS NOT NULL AND NEW.entry_time != '' THEN
        BEGIN
            NEW.time_of_day = EXTRACT(TIME FROM NEW.entry_time::timestamp);
            NEW.day_of_week = EXTRACT(DOW FROM NEW.entry_time::timestamp);
        EXCEPTION WHEN OTHERS THEN
            -- Handle invalid timestamp formats gracefully
            NULL;
        END;
    END IF;
    
    -- Auto-calculate risk metrics
    IF NEW.entry_price IS NOT NULL AND NEW.exit_price IS NOT NULL AND NEW.pnl IS NOT NULL THEN
        -- Calculate R-multiple (assuming 1% risk per trade)
        IF NEW.entry_price > 0 AND NEW.quantity > 0 THEN
            NEW.r_multiple = NEW.pnl / (NEW.entry_price * NEW.quantity * 0.01);
        END IF;
        
        -- Calculate risk-reward ratio (simplified)
        IF NEW.pnl > 0 THEN
            NEW.risk_reward_ratio = NEW.pnl / ABS(NEW.pnl * 0.5); -- Simplified calculation
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_trades_timestamps ON trades;
CREATE TRIGGER update_trades_timestamps
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_timestamps();

-- Fix performance_metrics table if it exists with wrong structure
DO $$
BEGIN
    -- Check if performance_metrics table exists and has wrong columns
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_metrics') THEN
        -- Drop the old table if it has wrong structure
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'performance_metrics' AND column_name = 'metric_date') THEN
            DROP TABLE IF EXISTS performance_metrics CASCADE;
        END IF;
    END IF;
END $$;

-- Recreate performance_metrics table with correct structure
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- 'daily_pnl', 'win_rate', 'profit_factor', 'max_drawdown'
    metric_value DECIMAL(15,4) NOT NULL,
    additional_data JSONB, -- Extra context for the metric
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, journal_id, metric_date, metric_type)
);

-- Create indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_journal ON performance_metrics(journal_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
