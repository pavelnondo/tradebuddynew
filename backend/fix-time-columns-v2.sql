-- Fix time storage by converting TIMESTAMP columns to VARCHAR
-- Handle views and existing columns properly

-- First, drop dependent views
DROP VIEW IF EXISTS trades_compat CASCADE;
DROP VIEW IF EXISTS trade_summary CASCADE;

-- Rename existing columns to backup
ALTER TABLE trades RENAME COLUMN entry_time TO entry_time_old;
ALTER TABLE trades RENAME COLUMN exit_time TO exit_time_old;

-- Create new VARCHAR columns
ALTER TABLE trades ADD COLUMN entry_time VARCHAR(25);
ALTER TABLE trades ADD COLUMN exit_time VARCHAR(25);

-- Convert existing timestamp data to string format (YYYY-MM-DDTHH:MM)
UPDATE trades 
SET entry_time = to_char(entry_time_old, 'YYYY-MM-DD"T"HH24:MI') 
WHERE entry_time_old IS NOT NULL;

UPDATE trades 
SET exit_time = to_char(exit_time_old, 'YYYY-MM-DD"T"HH24:MI') 
WHERE exit_time_old IS NOT NULL;

-- Verify the conversion
SELECT id, entry_time, exit_time, entry_time_old, exit_time_old 
FROM trades 
WHERE entry_time IS NOT NULL 
LIMIT 5;

-- Optional: Keep backup columns for safety
-- You can drop them later with:
-- ALTER TABLE trades DROP COLUMN entry_time_old;
-- ALTER TABLE trades DROP COLUMN exit_time_old;
