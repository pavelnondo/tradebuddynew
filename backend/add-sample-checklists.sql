-- Add Sample Checklists for TradeBuddy Showcase
-- This script adds comprehensive sample checklists to demonstrate checklist functionality

DO $$
DECLARE
    user_uuid UUID;
    checklist1_uuid UUID;
    checklist2_uuid UUID;
    checklist3_uuid UUID;
    checklist4_uuid UUID;
BEGIN
    -- Get user ID
    SELECT id INTO user_uuid FROM users WHERE email = 'pavel6nondo9@gmail.com';
    
    -- Clear existing checklists for clean showcase
    DELETE FROM checklists WHERE user_id = user_uuid;
    
    -- Add comprehensive sample checklists
    
    -- Pre-Trade Checklist
    INSERT INTO checklists (user_id, name, description, items, created_at)
    VALUES (
        user_uuid, 
        'Pre-Trade Checklist', 
        'Essential checks before entering any trade',
        '[
            {"id": "market_analysis", "text": "Analyze market conditions and trend", "completed": false},
            {"id": "risk_assessment", "text": "Calculate position size and risk/reward ratio", "completed": false},
            {"id": "entry_plan", "text": "Define clear entry and exit points", "completed": false},
            {"id": "stop_loss", "text": "Set stop-loss level", "completed": false},
            {"id": "take_profit", "text": "Set take-profit targets", "completed": false},
            {"id": "news_check", "text": "Check for upcoming news or events", "completed": false},
            {"id": "emotion_check", "text": "Ensure trading with clear mind (not emotional)", "completed": false}
        ]'::jsonb,
        NOW()
    ) RETURNING id INTO checklist1_uuid;
    
    -- Day Trading Checklist
    INSERT INTO checklists (user_id, name, description, items, created_at)
    VALUES (
        user_uuid, 
        'Day Trading Checklist', 
        'Specific checks for day trading activities',
        '[
            {"id": "market_open", "text": "Check market open conditions and volume", "completed": false},
            {"id": "gap_analysis", "text": "Analyze overnight gaps and pre-market action", "completed": false},
            {"id": "support_resistance", "text": "Identify key support and resistance levels", "completed": false},
            {"id": "momentum_indicators", "text": "Check momentum indicators (RSI, MACD)", "completed": false},
            {"id": "volume_confirmation", "text": "Ensure volume confirms price action", "completed": false},
            {"id": "time_management", "text": "Set time limits for trade duration", "completed": false},
            {"id": "profit_targets", "text": "Define quick profit targets for scalping", "completed": false}
        ]'::jsonb,
        NOW()
    ) RETURNING id INTO checklist2_uuid;
    
    -- Swing Trading Checklist
    INSERT INTO checklists (user_id, name, description, items, created_at)
    VALUES (
        user_uuid, 
        'Swing Trading Checklist', 
        'Checks for swing trading positions (1-5 days)',
        '[
            {"id": "weekly_analysis", "text": "Analyze weekly chart for overall trend", "completed": false},
            {"id": "daily_setup", "text": "Identify daily chart setup and pattern", "completed": false},
            {"id": "fundamental_analysis", "text": "Review fundamental factors and earnings", "completed": false},
            {"id": "sector_analysis", "text": "Check sector rotation and relative strength", "completed": false},
            {"id": "position_sizing", "text": "Calculate appropriate position size for swing", "completed": false},
            {"id": "overnight_risk", "text": "Assess overnight and weekend risk", "completed": false},
            {"id": "profit_taking", "text": "Plan profit-taking strategy for multiple targets", "completed": false}
        ]'::jsonb,
        NOW()
    ) RETURNING id INTO checklist3_uuid;
    
    -- Post-Trade Review Checklist
    INSERT INTO checklists (user_id, name, description, items, created_at)
    VALUES (
        user_uuid, 
        'Post-Trade Review', 
        'Review completed trades for learning',
        '[
            {"id": "trade_outcome", "text": "Record final P&L and trade outcome", "completed": false},
            {"id": "entry_analysis", "text": "Review entry timing and execution", "completed": false},
            {"id": "exit_analysis", "text": "Analyze exit timing and decision making", "completed": false},
            {"id": "emotion_review", "text": "Note emotional state during trade", "completed": false},
            {"id": "lesson_learned", "text": "Identify key lessons from this trade", "completed": false},
            {"id": "improvement_areas", "text": "Note areas for improvement", "completed": false},
            {"id": "screenshot_save", "text": "Save chart screenshot for future reference", "completed": false}
        ]'::jsonb,
        NOW()
    ) RETURNING id INTO checklist4_uuid;

    RAISE NOTICE 'Added sample checklists for user: %', user_uuid;
    RAISE NOTICE 'Pre-Trade Checklist ID: %', checklist1_uuid;
    RAISE NOTICE 'Day Trading Checklist ID: %', checklist2_uuid;
    RAISE NOTICE 'Swing Trading Checklist ID: %', checklist3_uuid;
    RAISE NOTICE 'Post-Trade Review Checklist ID: %', checklist4_uuid;
END $$;
