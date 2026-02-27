-- Add voice_note_urls column to trades
-- Stores JSON array of { url, duration?, transcript? } for playable voice notes

ALTER TABLE trades ADD COLUMN IF NOT EXISTS voice_note_urls JSONB DEFAULT '[]';

COMMENT ON COLUMN trades.voice_note_urls IS 'Array of { url, duration?, transcript? } for voice note attachments';
