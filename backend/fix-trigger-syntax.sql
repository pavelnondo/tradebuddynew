-- Fix PostgreSQL trigger syntax for time extraction

CREATE OR REPLACE FUNCTION update_trade_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-calculate time fields (handle string timestamps)
    IF NEW.entry_time IS NOT NULL AND NEW.entry_time != '' THEN
        BEGIN
            NEW.time_of_day = (NEW.entry_time::timestamp)::time;
            NEW.day_of_week = EXTRACT(DOW FROM NEW.entry_time::timestamp);
        EXCEPTION WHEN OTHERS THEN
            -- Handle invalid timestamp formats gracefully
            NULL;
        END;
    END IF;
    
    -- Auto-calculate risk metrics
    IF NEW.entry_price IS NOT NULL AND NEW.exit_price IS NOT NULL AND NEW.pnl IS NOT NULL THEN
        -- Calculate R-multiple (assuming 1% risk per trade)
        IF NEW.entry_price > 0 AND NEW.quantity > 0 THEN
            NEW.r_multiple = NEW.pnl / (NEW.entry_price * NEW.quantity * 0.01);
        END IF;
        
        -- Calculate risk-reward ratio (simplified)
        IF NEW.pnl > 0 THEN
            NEW.risk_reward_ratio = NEW.pnl / ABS(NEW.pnl * 0.5); -- Simplified calculation
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_trades_timestamps
    BEFORE UPDATE ON trades
    FOR EACH ROW
    EXECUTE FUNCTION update_trade_timestamps();
