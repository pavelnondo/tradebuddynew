-- Fix time storage by converting TIMESTAMP columns to VARCHAR
-- This completely avoids PostgreSQL timezone conversion issues

-- First, create backup columns to preserve existing data
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_time_backup TIMESTAMP;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_time_backup TIMESTAMP;

-- Copy existing data to backup
UPDATE trades SET entry_time_backup = entry_time WHERE entry_time IS NOT NULL;
UPDATE trades SET exit_time_backup = exit_time WHERE exit_time IS NOT NULL;

-- Drop the existing timestamp columns
ALTER TABLE trades DROP COLUMN IF EXISTS entry_time;
ALTER TABLE trades DROP COLUMN IF EXISTS exit_time;

-- Create new VARCHAR columns for time storage
ALTER TABLE trades ADD COLUMN entry_time VARCHAR(25);
ALTER TABLE trades ADD COLUMN exit_time VARCHAR(25);

-- Convert backup data to the format we want (YYYY-MM-DDTHH:MM)
UPDATE trades 
SET entry_time = to_char(entry_time_backup, 'YYYY-MM-DD"T"HH24:MI') 
WHERE entry_time_backup IS NOT NULL;

UPDATE trades 
SET exit_time = to_char(exit_time_backup, 'YYYY-MM-DD"T"HH24:MI') 
WHERE exit_time_backup IS NOT NULL;

-- Optional: Drop backup columns after verification
-- ALTER TABLE trades DROP COLUMN entry_time_backup;
-- ALTER TABLE trades DROP COLUMN exit_time_backup;

-- Verify the change
SELECT id, entry_time, exit_time, entry_time_backup, exit_time_backup 
FROM trades 
WHERE entry_time IS NOT NULL 
LIMIT 5;
