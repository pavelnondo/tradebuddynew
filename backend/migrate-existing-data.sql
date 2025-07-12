-- Migration script to handle existing data and ensure user isolation
-- Run this after the main schema migration

-- Add user_id columns to existing tables if they don't exist
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON screenshots(user_id);

-- For existing data without user_id, we need to handle it appropriately
-- Option 1: Delete existing data (recommended for fresh start)
-- DELETE FROM trades WHERE user_id IS NULL;
-- DELETE FROM checklists WHERE user_id IS NULL;
-- DELETE FROM screenshots WHERE user_id IS NULL;

-- Option 2: Assign to a default user (if you want to keep existing data)
-- First, create a default user if it doesn't exist
INSERT INTO users (username, email, password_hash, role) 
VALUES ('default_user', 'default@tradebuddy.local', '$2a$12$default.hash.for.existing.data', 'user')
ON CONFLICT (email) DO NOTHING;

-- Then assign existing data to the default user
UPDATE trades SET user_id = (SELECT id FROM users WHERE email = 'default@tradebuddy.local') WHERE user_id IS NULL;
UPDATE checklists SET user_id = (SELECT id FROM users WHERE email = 'default@tradebuddy.local') WHERE user_id IS NULL;
UPDATE screenshots SET user_id = (SELECT id FROM users WHERE email = 'default@tradebuddy.local') WHERE user_id IS NULL;

-- Verify the migration
SELECT 'trades' as table_name, COUNT(*) as total_records, COUNT(user_id) as records_with_user_id 
FROM trades 
UNION ALL
SELECT 'checklists' as table_name, COUNT(*) as total_records, COUNT(user_id) as records_with_user_id 
FROM checklists 
UNION ALL
SELECT 'screenshots' as table_name, COUNT(*) as total_records, COUNT(user_id) as records_with_user_id 
FROM screenshots; 