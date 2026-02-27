-- Add Planning and Goals Sample Data for TradeBuddy Showcase
-- This script adds comprehensive planning and goals data to demonstrate the functionality

DO $$
DECLARE
    user_uuid UUID;
    goal1_uuid UUID;
    goal2_uuid UUID;
    goal3_uuid UUID;
    goal4_uuid UUID;
    goal5_uuid UUID;
BEGIN
    -- Get user ID
    SELECT id INTO user_uuid FROM users WHERE email = 'pavel6nondo9@gmail.com';
    
    -- Clear existing goals for clean showcase
    DELETE FROM performance_metrics WHERE user_id = user_uuid;
    
    -- Add comprehensive planning and goals data
    
    -- Monthly Profit Target
    INSERT INTO performance_metrics (user_id, metric_name, metric_value, target_value, period, created_at, updated_at)
    VALUES (
        user_uuid, 
        'Monthly Profit Target', 
        14325.75, 
        15000.00, 
        'monthly',
        NOW(),
        NOW()
    ) RETURNING id INTO goal1_uuid;
    
    -- Win Rate Goal
    INSERT INTO performance_metrics (user_id, metric_name, metric_value, target_value, period, created_at, updated_at)
    VALUES (
        user_uuid, 
        'Win Rate Target', 
        68.42, 
        70.00, 
        'monthly',
        NOW(),
        NOW()
    ) RETURNING id INTO goal2_uuid;
    
    -- Risk Management Goal
    INSERT INTO performance_metrics (user_id, metric_name, metric_value, target_value, period, created_at, updated_at)
    VALUES (
        user_uuid, 
        'Max Daily Loss', 
        500.00, 
        1000.00, 
        'daily',
        NOW(),
        NOW()
    ) RETURNING id INTO goal3_uuid;
    
    -- Trade Frequency Goal
    INSERT INTO performance_metrics (user_id, metric_name, metric_value, target_value, period, created_at, updated_at)
    VALUES (
        user_uuid, 
        'Trades Per Week', 
        4.75, 
        5.00, 
        'weekly',
        NOW(),
        NOW()
    ) RETURNING id INTO goal4_uuid;
    
    -- Account Growth Goal
    INSERT INTO performance_metrics (user_id, metric_name, metric_value, target_value, period, created_at, updated_at)
    VALUES (
        user_uuid, 
        'Account Growth %', 
        43.25, 
        50.00, 
        'monthly',
        NOW(),
        NOW()
    ) RETURNING id INTO goal5_uuid;

    RAISE NOTICE 'Added planning and goals data for user: %', user_uuid;
    RAISE NOTICE 'Monthly Profit Target ID: %', goal1_uuid;
    RAISE NOTICE 'Win Rate Target ID: %', goal2_uuid;
    RAISE NOTICE 'Max Daily Loss ID: %', goal3_uuid;
    RAISE NOTICE 'Trades Per Week ID: %', goal4_uuid;
    RAISE NOTICE 'Account Growth ID: %', goal5_uuid;
END $$;
