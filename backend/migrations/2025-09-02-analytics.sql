-- Analytics enhancements: add optional columns and helpful indexes
-- Safe to run multiple times due to IF NOT EXISTS checks

-- Add columns to trades if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='trades' AND column_name='commission'
  ) THEN
    ALTER TABLE trades ADD COLUMN commission NUMERIC(15,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='trades' AND column_name='fees'
  ) THEN
    ALTER TABLE trades ADD COLUMN fees NUMERIC(15,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='trades' AND column_name='pnl_percentage'
  ) THEN
    ALTER TABLE trades ADD COLUMN pnl_percentage NUMERIC(8,4);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='trades' AND column_name='duration_minutes'
  ) THEN
    ALTER TABLE trades ADD COLUMN duration_minutes INTEGER;
  END IF;
END $$;

-- Indexes to speed up analytics queries
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_entry_time ON trades(entry_time);
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_trade_type ON trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_trades_emotion ON trades(emotion);
CREATE INDEX IF NOT EXISTS idx_trades_pnl ON trades(pnl);


