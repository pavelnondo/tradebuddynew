-- Comprehensive Sample Data for TradeBuddy Showcase
-- This script adds diverse sample trades and checklists to demonstrate all features

-- First, let's get the user ID and journal IDs for pavel6nondo9@gmail.com
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
    
    -- If journals don't exist, create them
    IF journal1_uuid IS NULL THEN
        INSERT INTO journals (user_id, name, account_type, broker, initial_balance, current_balance, currency)
        VALUES (user_uuid, 'Journal 1', 'paper', 'Interactive Brokers', 10000, 10000, 'USD')
        RETURNING id INTO journal1_uuid;
    END IF;
    
    IF journal2_uuid IS NULL THEN
        INSERT INTO journals (user_id, name, account_type, broker, initial_balance, current_balance, currency)
        VALUES (user_uuid, 'Main Trading Account', 'paper', 'TD Ameritrade', 10000, 10000, 'USD')
        RETURNING id INTO journal2_uuid;
    END IF;
    
    IF journal3_uuid IS NULL THEN
        INSERT INTO journals (user_id, name, account_type, broker, initial_balance, current_balance, currency)
        VALUES (user_uuid, 'Swing Trading Account', 'paper', 'E*TRADE', 25000, 25000, 'USD')
        RETURNING id INTO journal3_uuid;
    END IF;

    -- Clear existing trades for clean showcase
    DELETE FROM trades WHERE user_id = user_uuid;
    
    -- Add comprehensive sample trades with diverse data
    
    -- JOURNAL 1 - Day Trading Focus (High frequency, smaller profits)
    INSERT INTO trades (user_id, journal_id, symbol, type, trade_type, direction, entry_price, exit_price, quantity, position_size, entry_time, exit_time, emotion, confidence_level, execution_quality, setup_type, market_condition, notes, tags, pnl, duration, checklist_id, checklist_items, screenshot_url) VALUES
    (user_uuid, journal1_uuid, 'AAPL', 'buy', 'buy', 'long', 150.25, 152.80, 100, 100, '2025-01-15 09:30:00', '2025-01-15 10:15:00', 'confident', 8, 9, 'breakout', 'trending', 'Clean breakout above resistance with strong volume', '["breakout", "tech", "momentum"]', 255.00, 45, NULL, NULL, NULL),
    (user_uuid, journal1_uuid, 'TSLA', 'sell', 'sell', 'short', 245.50, 242.10, 50, 50, '2025-01-15 11:00:00', '2025-01-15 11:45:00', 'nervous', 6, 7, 'reversal', 'volatile', 'Short at resistance with bearish divergence', '["reversal", "tech", "short"]', 170.00, 45, NULL, NULL, NULL),
    (user_uuid, journal1_uuid, 'NVDA', 'buy', 'buy', 'long', 420.75, 418.20, 25, 25, '2025-01-15 13:20:00', '2025-01-15 14:00:00', 'frustrated', 4, 3, 'scalp', 'choppy', 'Poor entry timing, got caught in consolidation', '["scalp", "tech", "loss"]', -63.75, 40, NULL, NULL, NULL),
    (user_uuid, journal1_uuid, 'MSFT', 'buy', 'buy', 'long', 380.40, 385.90, 75, 75, '2025-01-15 14:30:00', '2025-01-15 15:45:00', 'excited', 9, 9, 'momentum', 'trending', 'Perfect momentum trade with institutional buying', '["momentum", "tech", "institutional"]', 412.50, 75, NULL, NULL, NULL),
    (user_uuid, journal1_uuid, 'GOOGL', 'sell', 'sell', 'short', 142.80, 140.25, 40, 40, '2025-01-15 15:50:00', '2025-01-15 16:00:00', 'confident', 7, 8, 'scalp', 'trending', 'Quick scalp on end-of-day weakness', '["scalp", "tech", "eod"]', 102.00, 10, NULL, NULL, NULL);

    -- JOURNAL 2 - Main Trading Account (Mixed strategies, moderate frequency)
    INSERT INTO trades (user_id, journal_id, symbol, type, trade_type, direction, entry_price, exit_price, quantity, position_size, entry_time, exit_time, emotion, confidence_level, execution_quality, setup_type, market_condition, notes, tags, pnl, duration, checklist_id, checklist_items, screenshot_url) VALUES
    (user_uuid, journal2_uuid, 'SPY', 'buy', 'buy', 'long', 485.20, 492.15, 200, 200, '2025-01-14 10:00:00', '2025-01-14 15:30:00', 'confident', 8, 'excellent', 'trend_follow', 'trending', 'Strong uptrend continuation with volume confirmation', '["trend", "etf", "swing"]', 1390.00, 330, NULL, NULL, NULL),
    (user_uuid, journal2_uuid, 'QQQ', 'buy', 'buy', 'long', 415.80, 410.25, 150, 150, '2025-01-13 09:45:00', '2025-01-13 16:00:00', 'disappointed', 5, 'fair', 'mean_reversion', 'ranging', 'Mean reversion failed, market continued lower', '["mean_reversion", "etf", "tech"]', -832.50, 375, NULL, NULL, NULL),
    (user_uuid, journal2_uuid, 'IWM', 'sell', 'sell', 'short', 195.40, 192.80, 100, 100, '2025-01-12 11:30:00', '2025-01-12 14:15:00', 'satisfied', 7, 'good', 'breakdown', 'volatile', 'Clean breakdown below support with volume', '["breakdown", "small_cap", "short"]', 260.00, 165, NULL, NULL, NULL),
    (user_uuid, journal2_uuid, 'XLF', 'buy', 'buy', 'long', 38.75, 40.20, 300, 300, '2025-01-11 10:15:00', '2025-01-11 15:45:00', 'excited', 9, 'excellent', 'sector_rotation', 'trending', 'Financial sector rotation with Fed policy support', '["sector_rotation", "financial", "fundamental"]', 435.00, 330, NULL, NULL, NULL),
    (user_uuid, journal2_uuid, 'XLK', 'buy', 'buy', 'long', 185.60, 183.20, 200, 200, '2025-01-10 09:30:00', '2025-01-10 16:00:00', 'frustrated', 4, 'poor', 'breakout', 'choppy', 'False breakout, got trapped in consolidation', '["breakout", "tech", "false_breakout"]', -480.00, 390, NULL, NULL, NULL);

    -- JOURNAL 3 - Swing Trading Account (Longer timeframes, larger positions)
    INSERT INTO trades (user_id, journal_id, symbol, type, trade_type, direction, entry_price, exit_price, quantity, position_size, entry_time, exit_time, emotion, confidence_level, execution_quality, setup_type, market_condition, notes, tags, pnl, duration, checklist_id, checklist_items, screenshot_url) VALUES
    (user_uuid, journal3_uuid, 'AMZN', 'buy', 'buy', 'long', 155.80, 168.50, 500, 500, '2025-01-08 10:00:00', '2025-01-15 15:30:00', 'excited', 9, 'excellent', 'earnings_play', 'trending', 'Strong earnings beat with guidance raise', '["earnings", "growth", "fundamental"]', 6350.00, 10050, NULL, NULL, NULL),
    (user_uuid, journal3_uuid, 'META', 'buy', 'buy', 'long', 325.40, 318.75, 300, 300, '2025-01-05 09:30:00', '2025-01-12 16:00:00', 'disappointed', 6, 'fair', 'technical_setup', 'volatile', 'Technical setup failed due to regulatory concerns', '["technical", "social_media", "regulatory"]', -1995.00, 10050, NULL, NULL, NULL),
    (user_uuid, journal3_uuid, 'NFLX', 'sell', 'sell', 'short', 485.20, 472.80, 200, 200, '2025-01-03 11:00:00', '2025-01-10 14:30:00', 'satisfied', 8, 'excellent', 'short_setup', 'trending', 'Perfect short setup with overvaluation concerns', '["short", "streaming", "valuation"]', 2480.00, 10050, NULL, NULL, NULL),
    (user_uuid, journal3_uuid, 'CRM', 'buy', 'buy', 'long', 245.60, 258.90, 400, 400, '2025-01-01 10:30:00', '2025-01-08 15:45:00', 'confident', 8, 'good', 'fundamental', 'trending', 'Strong SaaS fundamentals with AI integration', '["saas", "ai", "fundamental"]', 5320.00, 10095, NULL, NULL, NULL),
    (user_uuid, journal3_uuid, 'ADBE', 'buy', 'buy', 'long', 580.25, 575.40, 150, 150, '2024-12-28 09:45:00', '2025-01-05 16:00:00', 'frustrated', 5, 'fair', 'momentum', 'choppy', 'Momentum trade failed in choppy market', '["momentum", "software", "choppy"]', -727.50, 12015, NULL, NULL, NULL);

    -- Add some crypto trades for diversity
    INSERT INTO trades (user_id, journal_id, symbol, type, trade_type, direction, entry_price, exit_price, quantity, position_size, entry_time, exit_time, emotion, confidence_level, execution_quality, setup_type, market_condition, notes, tags, pnl, duration, checklist_id, checklist_items, screenshot_url) VALUES
    (user_uuid, journal1_uuid, 'BTC-USD', 'buy', 'buy', 'long', 42500.00, 43800.00, 0.1, 0.1, '2025-01-14 08:00:00', '2025-01-14 20:00:00', 'excited', 8, 'excellent', 'breakout', 'trending', 'Bitcoin breakout above key resistance', '["crypto", "bitcoin", "breakout"]', 130.00, 720, NULL, NULL, NULL),
    (user_uuid, journal2_uuid, 'ETH-USD', 'sell', 'sell', 'short', 2650.00, 2580.00, 1.0, 1.0, '2025-01-13 12:00:00', '2025-01-13 18:00:00', 'confident', 7, 'good', 'reversal', 'volatile', 'Ethereum short at resistance with bearish divergence', '["crypto", "ethereum", "short"]', 70.00, 360, NULL, NULL, NULL);

    -- Add some forex trades
    INSERT INTO trades (user_id, journal_id, symbol, type, trade_type, direction, entry_price, exit_price, quantity, position_size, entry_time, exit_time, emotion, confidence_level, execution_quality, setup_type, market_condition, notes, tags, pnl, duration, checklist_id, checklist_items, screenshot_url) VALUES
    (user_uuid, journal3_uuid, 'EUR/USD', 'buy', 'buy', 'long', 1.0850, 1.0920, 100000, 100000, '2025-01-12 08:00:00', '2025-01-14 16:00:00', 'satisfied', 7, 'good', 'fundamental', 'trending', 'EUR strength on ECB hawkish comments', '["forex", "eur", "fundamental"]', 700.00, 5760, NULL, NULL, NULL),
    (user_uuid, journal2_uuid, 'GBP/USD', 'sell', 'sell', 'short', 1.2750, 1.2680, 50000, 50000, '2025-01-11 10:00:00', '2025-01-11 22:00:00', 'confident', 8, 'excellent', 'technical', 'volatile', 'GBP weakness on technical breakdown', '["forex", "gbp", "technical"]', 350.00, 720, NULL, NULL, NULL);

    -- Update journal balances based on trades
    UPDATE journals SET current_balance = initial_balance + (
        SELECT COALESCE(SUM(pnl), 0) FROM trades WHERE journal_id = journals.id
    ) WHERE user_id = user_uuid;

    RAISE NOTICE 'Added comprehensive sample data for user: %', user_uuid;
    RAISE NOTICE 'Journal 1 ID: %', journal1_uuid;
    RAISE NOTICE 'Journal 2 ID: %', journal2_uuid;
    RAISE NOTICE 'Journal 3 ID: %', journal3_uuid;
END $$;
