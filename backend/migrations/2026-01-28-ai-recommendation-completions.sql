-- Migration: AI Recommendation Completions Tracking
-- Tracks completion of AI-generated action items/recommendations per trade
-- Allows visualization of improvement over time

CREATE TABLE IF NOT EXISTS ai_recommendation_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
    trade_id UUID REFERENCES trades(id) ON DELETE CASCADE,
    
    -- The recommendation text (from AI insights)
    recommendation_text TEXT NOT NULL,
    
    -- Whether it was completed for this trade
    completed BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one completion record per recommendation per trade
    UNIQUE(trade_id, recommendation_text)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_completions_trade_id ON ai_recommendation_completions(trade_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_completions_journal_id ON ai_recommendation_completions(journal_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_completions_user_id ON ai_recommendation_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendation_completions_created_at ON ai_recommendation_completions(created_at);

-- Add column to trades table to store which recommendations were available at trade time
ALTER TABLE trades ADD COLUMN IF NOT EXISTS ai_recommendations JSONB DEFAULT '[]'::jsonb;

COMMENT ON TABLE ai_recommendation_completions IS 'Tracks completion of AI-generated recommendations/action items for each trade';
COMMENT ON COLUMN trades.ai_recommendations IS 'Array of recommendation texts that were available when this trade was created';
