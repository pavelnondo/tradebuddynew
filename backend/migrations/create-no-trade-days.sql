-- No Trade Days - Days with no trades but chart observations/notes
CREATE TABLE IF NOT EXISTS no_trade_days (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  journal_id UUID REFERENCES journals(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, journal_id, date)
);

CREATE INDEX IF NOT EXISTS idx_no_trade_days_user ON no_trade_days(user_id);
CREATE INDEX IF NOT EXISTS idx_no_trade_days_journal ON no_trade_days(journal_id);
CREATE INDEX IF NOT EXISTS idx_no_trade_days_date ON no_trade_days(date);
