-- Fix quantity column to allow decimal values for position sizes
-- Change quantity from INTEGER to DECIMAL to support fractional position sizes

-- First, let's check the current column type
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'trades' AND column_name = 'quantity';

-- Change the quantity column to DECIMAL(10,4) to support fractional position sizes
ALTER TABLE trades ALTER COLUMN quantity TYPE DECIMAL(10,4);

-- Verify the change
SELECT column_name, data_type, numeric_precision, numeric_scale 
FROM information_schema.columns 
WHERE table_name = 'trades' AND column_name = 'quantity'; 