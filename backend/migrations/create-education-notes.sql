-- Education Notes table for tracking learned trading concepts
-- Run this migration to add the education feature

CREATE TABLE IF NOT EXISTS education_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Concept details
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100), -- e.g. 'technical_analysis', 'risk_management', 'psychology', 'strategy'
    tags TEXT[], -- e.g. ['support/resistance', 'RSI', 'trend lines']
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_education_notes_user_id ON education_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_education_notes_created_at ON education_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_education_notes_category ON education_notes(category);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_education_notes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS education_notes_updated_at ON education_notes;
CREATE TRIGGER education_notes_updated_at
    BEFORE UPDATE ON education_notes
    FOR EACH ROW
    EXECUTE PROCEDURE update_education_notes_updated_at();
