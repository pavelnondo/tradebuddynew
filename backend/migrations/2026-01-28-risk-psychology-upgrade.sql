-- TradeBuddy Risk & Psychology Upgrade (Phase Foundation)
-- Backward compatible: all new fields nullable with null-safe defaults

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'trade_session_enum'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE trade_session_enum AS ENUM ('Asia', 'London', 'NewYork', 'Other');
  END IF;
END $$;

ALTER TABLE trades ADD COLUMN IF NOT EXISTS planned_risk_amount DECIMAL(15,6);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS planned_risk_percent DECIMAL(10,6);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss_price DECIMAL(15,6);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit_price DECIMAL(15,6);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS planned_rr DECIMAL(15,6);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS actual_rr DECIMAL(15,6);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS r_multiple DECIMAL(15,6);
ALTER TABLE trades ADD COLUMN IF NOT EXISTS trade_number_of_day INTEGER;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS session trade_session_enum;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS risk_consistency_flag BOOLEAN;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS checklist_completion_percent DECIMAL(5,2);

CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session);
CREATE INDEX IF NOT EXISTS idx_trades_trade_number_of_day ON trades(trade_number_of_day);
CREATE INDEX IF NOT EXISTS idx_trades_r_multiple ON trades(r_multiple);
CREATE INDEX IF NOT EXISTS idx_trades_planned_risk_percent ON trades(planned_risk_percent);
CREATE INDEX IF NOT EXISTS idx_trades_checklist_completion_percent ON trades(checklist_completion_percent);
