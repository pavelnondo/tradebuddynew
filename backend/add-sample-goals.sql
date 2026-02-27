-- Add Sample Goals Data for TradeBuddy Showcase
-- This script adds comprehensive goals data to demonstrate planning functionality

DO $$
DECLARE
    user_uuid UUID;
    journal1_uuid UUID;
    journal2_uuid UUID;
    journal3_uuid UUID;
BEGIN
    -- Get user ID
    SELECT id INTO user_uuid FROM users WHERE email = 'pavel6nondo9@gmail.com';
    
    -- Get journal IDs
    SELECT id INTO journal1_uuid FROM journals WHERE user_id = user_uuid AND name = 'Journal 1' LIMIT 1;
    SELECT id INTO journal2_uuid FROM journals WHERE user_id = user_uuid AND name = 'Main Trading Account' LIMIT 1;
    SELECT id INTO journal3_uuid FROM journals WHERE user_id = user_uuid AND name = 'Swing Trading Account' LIMIT 1;
    
    -- Clear existing goals for clean showcase
    DELETE FROM goals WHERE user_id = user_uuid;
    
    -- Add comprehensive goals data
    
    -- Overall Portfolio Goals
    INSERT INTO goals (user_id, journal_id, title, description, goal_type, target_value, current_value, unit, period, status, start_date, end_date) VALUES
    (user_uuid, NULL, 'Monthly Profit Target', 'Achieve consistent monthly profits', 'profit', 15000.00, 14325.75, 'USD', 'monthly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, NULL, 'Win Rate Improvement', 'Maintain high win rate across all strategies', 'win_rate', 70.00, 68.42, '%', 'monthly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, NULL, 'Risk Management', 'Keep daily losses under control', 'risk_management', 1000.00, 500.00, 'USD', 'daily', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, NULL, 'Trade Frequency', 'Maintain consistent trading activity', 'trades_count', 20.00, 19.00, 'count', 'monthly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, NULL, 'Account Growth', 'Grow total portfolio by 50% this year', 'profit', 50.00, 43.25, '%', 'yearly', 'active', '2025-01-01', '2025-12-31');
    
    -- Journal 1 (Day Trading) Specific Goals
    INSERT INTO goals (user_id, journal_id, title, description, goal_type, target_value, current_value, unit, period, status, start_date, end_date) VALUES
    (user_uuid, journal1_uuid, 'Day Trading Profit', 'Daily profit target for day trading', 'profit', 200.00, 167.63, 'USD', 'daily', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, journal1_uuid, 'Day Trading Win Rate', 'Maintain high win rate for day trades', 'win_rate', 75.00, 66.67, '%', 'monthly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, journal1_uuid, 'Max Daily Loss', 'Keep day trading losses under $100', 'risk_management', 100.00, 63.75, 'USD', 'daily', 'active', '2025-01-01', '2025-12-31');
    
    -- Journal 2 (Main Trading) Specific Goals
    INSERT INTO goals (user_id, journal_id, title, description, goal_type, target_value, current_value, unit, period, status, start_date, end_date) VALUES
    (user_uuid, journal2_uuid, 'Main Account Growth', 'Grow main trading account by 20%', 'profit', 20.00, 11.93, '%', 'monthly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, journal2_uuid, 'Consistent Profits', 'Achieve consistent weekly profits', 'profit', 500.00, 170.36, 'USD', 'weekly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, journal2_uuid, 'Risk Control', 'Maintain strict risk management', 'risk_management', 2.00, 1.50, '%', 'daily', 'active', '2025-01-01', '2025-12-31');
    
    -- Journal 3 (Swing Trading) Specific Goals
    INSERT INTO goals (user_id, journal_id, title, description, goal_type, target_value, current_value, unit, period, status, start_date, end_date) VALUES
    (user_uuid, journal3_uuid, 'Swing Trading Returns', 'Achieve 30% annual returns', 'profit', 30.00, 48.51, '%', 'yearly', 'completed', '2025-01-01', '2025-12-31'),
    (user_uuid, journal3_uuid, 'Large Position Management', 'Successfully manage larger positions', 'learning', 10.00, 6.00, 'count', 'monthly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, journal3_uuid, 'Swing Win Rate', 'Maintain 60% win rate for swing trades', 'win_rate', 60.00, 66.67, '%', 'monthly', 'completed', '2025-01-01', '2025-12-31');
    
    -- Learning and Development Goals
    INSERT INTO goals (user_id, journal_id, title, description, goal_type, target_value, current_value, unit, period, status, start_date, end_date) VALUES
    (user_uuid, NULL, 'Strategy Mastery', 'Master 3 new trading strategies', 'learning', 3.00, 1.00, 'count', 'yearly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, NULL, 'Market Analysis', 'Complete daily market analysis', 'learning', 30.00, 15.00, 'count', 'monthly', 'active', '2025-01-01', '2025-12-31'),
    (user_uuid, NULL, 'Journal Review', 'Review and analyze trades weekly', 'learning', 4.00, 2.00, 'count', 'monthly', 'active', '2025-01-01', '2025-12-31');

    RAISE NOTICE 'Added comprehensive goals data for user: %', user_uuid;
    RAISE NOTICE 'Journal 1 ID: %', journal1_uuid;
    RAISE NOTICE 'Journal 2 ID: %', journal2_uuid;
    RAISE NOTICE 'Journal 3 ID: %', journal3_uuid;
END $$;
