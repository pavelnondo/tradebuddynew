-- Fix journals table schema - ensure all required columns exist
-- This migration adds missing columns that are referenced in the API

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add is_blown column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'journals' AND column_name = 'is_blown') THEN
        ALTER TABLE journals ADD COLUMN is_blown BOOLEAN DEFAULT false;
    END IF;

    -- Add is_passed column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'journals' AND column_name = 'is_passed') THEN
        ALTER TABLE journals ADD COLUMN is_passed BOOLEAN DEFAULT false;
    END IF;

    -- Add blown_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'journals' AND column_name = 'blown_at') THEN
        ALTER TABLE journals ADD COLUMN blown_at TIMESTAMP WITH TIME ZONE;
    END IF;

    -- Add passed_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'journals' AND column_name = 'passed_at') THEN
        ALTER TABLE journals ADD COLUMN passed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN journals.is_blown IS 'Whether the journal account has been blown (lost all capital)';
COMMENT ON COLUMN journals.is_passed IS 'Whether the journal account has passed its challenge/goal';
COMMENT ON COLUMN journals.blown_at IS 'Timestamp when the journal was marked as blown';
COMMENT ON COLUMN journals.passed_at IS 'Timestamp when the journal was marked as passed';
