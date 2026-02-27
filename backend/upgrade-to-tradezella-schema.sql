-- TradeZella Database Schema Upgrade
-- Enhanced schema for journaling-focused trading platform
-- Based on TradeZella UX & UI Feature Matrix

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- ==============================================
-- ENHANCED TRADES TABLE
-- ==============================================

-- Add new columns to existing trades table for TradeZella features
ALTER TABLE trades ADD COLUMN IF NOT EXISTS setup_category VARCHAR(50); -- 'breakout', 'reversal', 'momentum', 'scalp', 'swing'
ALTER TABLE trades ADD COLUMN IF NOT EXISTS market_session VARCHAR(20); -- 'premarket', 'open', 'midday', 'close', 'afterhours'
ALTER TABLE trades ADD COLUMN IF NOT EXISTS time_of_day TIME;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS day_of_week INTEGER; -- 0=Sunday, 6=Saturday
ALTER TABLE trades ADD COLUMN IF NOT EXISTS risk_reward_ratio DECIMAL(8,4);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS r_multiple DECIMAL(8,4); -- Risk multiple
ALTER TABLE trades ADD COLUMN IF NOT EXISTS max_adverse_excursion DECIMAL(15,2); -- MAE
ALTER TABLE trades ADD COLUMN IF NOT EXISTS max_favorable_excursion DECIMAL(15,2); -- MFE
ALTER TABLE trades ADD COLUMN IF NOT EXISTS slippage DECIMAL(10,2) DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_grade VARCHAR(10); -- 'A+', 'A', 'B', 'C', 'D', 'F'
ALTER TABLE trades ADD COLUMN IF NOT EXISTS mistake_type VARCHAR(100); -- 'fomo', 'revenge', 'overtrading', 'fear', 'greed'
ALTER TABLE trades ADD COLUMN IF NOT EXISTS lesson_learned TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS improvement_area VARCHAR(100);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS mentor_notes TEXT;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS is_playbook_trade BOOLEAN DEFAULT false;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS playbook_id UUID;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS journal_entry_id UUID;

-- ==============================================
-- TAGS AND CATEGORIZATION SYSTEM
-- ==============================================

-- Enhanced tags system
CREATE TABLE IF NOT EXISTS trade_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    tag_category VARCHAR(30), -- 'setup', 'emotion', 'mistake', 'symbol', 'custom'
    tag_color VARCHAR(7), -- Hex color code
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tag templates for quick selection
CREATE TABLE IF NOT EXISTS tag_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- JOURNAL ENTRIES SYSTEM
-- ==============================================

CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    entry_type VARCHAR(30) DEFAULT 'daily', -- 'daily', 'weekly', 'trade_review', 'setup_analysis', 'mistake_review'
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    market_sentiment VARCHAR(20), -- 'bullish', 'bearish', 'neutral', 'uncertain'
    key_insights TEXT[],
    action_items TEXT[],
    linked_trades UUID[], -- Array of trade IDs
    screenshots TEXT[],
    is_template BOOLEAN DEFAULT false,
    template_category VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal entry templates
CREATE TABLE IF NOT EXISTS journal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    template_content TEXT NOT NULL,
    category VARCHAR(50), -- 'daily', 'weekly', 'trade_review', 'setup_analysis'
    prompts TEXT[], -- Array of reflection prompts
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- PLAYBOOK SYSTEM
-- ==============================================

CREATE TABLE IF NOT EXISTS playbooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    setup_type VARCHAR(50) NOT NULL,
    category VARCHAR(30), -- 'breakout', 'reversal', 'momentum', 'scalp', 'swing'
    success_rate DECIMAL(5,2), -- Percentage
    avg_win DECIMAL(15,2),
    avg_loss DECIMAL(15,2),
    profit_factor DECIMAL(8,4),
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    chart_image_url TEXT,
    setup_rules TEXT[],
    entry_criteria TEXT[],
    exit_criteria TEXT[],
    risk_management TEXT[],
    common_mistakes TEXT[],
    is_public BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Playbook examples (linked trades)
CREATE TABLE IF NOT EXISTS playbook_examples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    example_type VARCHAR(20) DEFAULT 'success', -- 'success', 'failure', 'learning'
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- EMOTION AND PSYCHOLOGY TRACKING
-- ==============================================

CREATE TABLE IF NOT EXISTS emotion_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    emotion VARCHAR(50) NOT NULL, -- 'confident', 'fearful', 'greedy', 'frustrated', 'excited'
    intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
    trigger_event VARCHAR(100), -- What caused this emotion
    impact_on_trade VARCHAR(20), -- 'positive', 'negative', 'neutral'
    notes TEXT,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily mood tracking
CREATE TABLE IF NOT EXISTS daily_mood (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    sleep_hours DECIMAL(3,1),
    exercise_minutes INTEGER,
    meditation_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ==============================================
-- DASHBOARD AND WIDGETS SYSTEM
-- ==============================================

CREATE TABLE IF NOT EXISTS dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    layout_config JSONB NOT NULL, -- Grid layout configuration
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL, -- 'equity_curve', 'daily_pnl', 'win_rate', 'setup_performance'
    title VARCHAR(100) NOT NULL,
    config JSONB, -- Widget-specific configuration
    position_x INTEGER,
    position_y INTEGER,
    width INTEGER,
    height INTEGER,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- FILTERS AND SAVED VIEWS
-- ==============================================

CREATE TABLE IF NOT EXISTS saved_filters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    filter_config JSONB NOT NULL, -- Complete filter configuration
    is_global BOOLEAN DEFAULT false, -- Can be shared with other users
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- MENTORING AND SHARING
-- ==============================================

CREATE TABLE IF NOT EXISTS mentor_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentee_id UUID REFERENCES users(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'blocked'
    permissions JSONB, -- What the mentor can see/do
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shared_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'view', -- 'view', 'comment', 'edit'
    mentor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- PERFORMANCE METRICS AND ANALYTICS
-- ==============================================

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

-- ==============================================
-- NOTIFICATIONS AND REMINDERS
-- ==============================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'trade_reminder', 'journal_reminder', 'goal_reminder', 'mentor_feedback'
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    action_url TEXT, -- Link to relevant page
    metadata JSONB, -- Additional context
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Trade indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_journal ON trades(user_id, journal_id);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_setup_type ON trades(setup_type);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_pnl ON trades(pnl);
CREATE INDEX IF NOT EXISTS idx_trades_emotion ON trades(emotion);
CREATE INDEX IF NOT EXISTS idx_trades_grade ON trades(trade_grade);

-- Tag indexes
CREATE INDEX IF NOT EXISTS idx_trade_tags_trade_id ON trade_tags(trade_id);
CREATE INDEX IF NOT EXISTS idx_trade_tags_name ON trade_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_trade_tags_category ON trade_tags(tag_category);

-- Journal entry indexes
CREATE INDEX IF NOT EXISTS idx_journal_entries_user ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_journal ON journal_entries(journal_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_type ON journal_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created ON journal_entries(created_at);

-- Playbook indexes
CREATE INDEX IF NOT EXISTS idx_playbooks_user ON playbooks(user_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_setup_type ON playbooks(setup_type);
CREATE INDEX IF NOT EXISTS idx_playbooks_category ON playbooks(category);

-- Emotion log indexes
CREATE INDEX IF NOT EXISTS idx_emotion_logs_user ON emotion_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_trade ON emotion_logs(trade_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_emotion ON emotion_logs(emotion);

-- Daily mood indexes
CREATE INDEX IF NOT EXISTS idx_daily_mood_user_date ON daily_mood(user_id, date);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user ON performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_journal ON performance_metrics(journal_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);

-- ==============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Update trade timestamps
CREATE OR REPLACE FUNCTION update_trade_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-calculate time fields
    IF NEW.entry_time IS NOT NULL THEN
        NEW.time_of_day = EXTRACT(TIME FROM NEW.entry_time::timestamp);
        NEW.day_of_week = EXTRACT(DOW FROM NEW.entry_time::timestamp);
    END IF;
    
    -- Auto-calculate risk metrics
    IF NEW.entry_price IS NOT NULL AND NEW.exit_price IS NOT NULL AND NEW.pnl IS NOT NULL THEN
        -- Calculate R-multiple (assuming 1% risk per trade)
        NEW.r_multiple = NEW.pnl / (NEW.entry_price * NEW.quantity * 0.01);
        
        -- Calculate risk-reward ratio (simplified)
        IF NEW.pnl > 0 THEN
            NEW.risk_reward_ratio = NEW.pnl / ABS(NEW.pnl * 0.5); -- Simplified calculation
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trades_timestamps
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_timestamps();

-- Update journal entry timestamps
CREATE OR REPLACE FUNCTION update_journal_entry_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journal_entries_timestamps
    BEFORE UPDATE ON journal_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_journal_entry_timestamps();

-- ==============================================
-- SAMPLE DATA FOR TESTING
-- ==============================================

-- Insert default tag templates
INSERT INTO tag_templates (user_id, name, category, color, is_default) VALUES
(NULL, 'Breakout', 'setup', '#10B981', true),
(NULL, 'Reversal', 'setup', '#F59E0B', true),
(NULL, 'Momentum', 'setup', '#3B82F6', true),
(NULL, 'Scalp', 'setup', '#8B5CF6', true),
(NULL, 'Swing', 'setup', '#06B6D4', true),
(NULL, 'Confident', 'emotion', '#10B981', true),
(NULL, 'Fearful', 'emotion', '#EF4444', true),
(NULL, 'Greedy', 'emotion', '#F59E0B', true),
(NULL, 'Frustrated', 'emotion', '#DC2626', true),
(NULL, 'FOMO', 'mistake', '#EF4444', true),
(NULL, 'Revenge Trade', 'mistake', '#DC2626', true),
(NULL, 'Overtrading', 'mistake', '#F59E0B', true);

-- Insert default journal templates
INSERT INTO journal_templates (user_id, name, description, template_content, category, prompts, is_default) VALUES
(NULL, 'Daily Review', 'Daily trading journal template', 
'# Daily Trading Review - {{date}}

## Market Overview
- Market sentiment: 
- Key events: 
- Overall strategy: 

## Trades Today
- Number of trades: 
- Win rate: 
- Key learnings: 

## Emotions & Psychology
- Mood rating (1-10): 
- Energy level (1-10): 
- Main emotions: 

## Tomorrow''s Plan
- Key setups to watch: 
- Risk management: 
- Goals: 

## Notes
', 'daily', 
ARRAY['What was the overall market sentiment today?', 'How did I feel during trading?', 'What did I learn from today''s trades?', 'What will I focus on tomorrow?'], 
true),

(NULL, 'Trade Review', 'Detailed trade analysis template',
'# Trade Review - {{symbol}} {{date}}

## Trade Details
- Entry: ${{entry_price}}
- Exit: ${{exit_price}}
- P&L: ${{pnl}}
- Setup: {{setup_type}}

## Analysis
### What went well:
- 

### What went wrong:
- 

### Key learnings:
- 

## Psychology
- Emotion during trade: 
- Confidence level: 
- Stress level: 

## Next time:
- 

## Grade: {{trade_grade}}
', 'trade_review',
ARRAY['What was the setup?', 'How did I execute?', 'What emotions did I feel?', 'What would I do differently?'],
true);

-- Insert default dashboard widgets
INSERT INTO dashboard_widgets (user_id, widget_type, title, config, position_x, position_y, width, height, is_visible) VALUES
(NULL, 'equity_curve', 'Equity Curve', '{"showDrawdown": true, "timeframe": "30d"}', 0, 0, 6, 4, true),
(NULL, 'daily_pnl', 'Daily P&L', '{"timeframe": "7d", "showTarget": true}', 6, 0, 3, 2, true),
(NULL, 'win_rate', 'Win Rate', '{"timeframe": "30d", "showTrend": true}', 9, 0, 3, 2, true),
(NULL, 'setup_performance', 'Setup Performance', '{"timeframe": "30d", "showCount": true}', 0, 4, 6, 3, true),
(NULL, 'emotion_tracking', 'Emotion Tracking', '{"timeframe": "7d", "showTrend": true}', 6, 2, 3, 2, true),
(NULL, 'recent_trades', 'Recent Trades', '{"limit": 5, "showPnL": true}', 9, 2, 3, 2, true);

COMMENT ON TABLE trades IS 'Enhanced trades table with TradeZella features for comprehensive trade analysis';
COMMENT ON TABLE trade_tags IS 'Flexible tagging system for trades with categories and colors';
COMMENT ON TABLE journal_entries IS 'Journal entries for reflection and learning';
COMMENT ON TABLE playbooks IS 'Trading playbooks for setup patterns and strategies';
COMMENT ON TABLE emotion_logs IS 'Detailed emotion tracking for psychological analysis';
COMMENT ON TABLE daily_mood IS 'Daily mood and wellness tracking';
COMMENT ON TABLE dashboard_widgets IS 'Configurable dashboard widgets for personalized views';
COMMENT ON TABLE saved_filters IS 'Saved filter configurations for quick data access';
