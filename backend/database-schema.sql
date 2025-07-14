-- Add processing_id column to existing trades table
ALTER TABLE trades ADD COLUMN IF NOT EXISTS processing_id VARCHAR(255);

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telegram_id BIGINT UNIQUE,
    telegram_username VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add user_id to existing tables
ALTER TABLE trades ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE ai_analysis ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE processing_logs ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE voice_messages ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE document_uploads ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE checklists ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE screenshots ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

-- Create AI analysis table
CREATE TABLE IF NOT EXISTS ai_analysis (
    id SERIAL PRIMARY KEY,
    trade_id INTEGER REFERENCES trades(id) ON DELETE CASCADE,
    processing_id VARCHAR(255) NOT NULL,
    sentiment VARCHAR(50),
    confidence VARCHAR(50),
    suggested_rating VARCHAR(10),
    recommendations JSONB,
    voice_transcript TEXT,
    analysis_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create processing logs table for tracking
CREATE TABLE IF NOT EXISTS processing_logs (
    id SERIAL PRIMARY KEY,
    processing_id VARCHAR(255) UNIQUE NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    chat_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    username VARCHAR(100),
    raw_message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    n8n_response JSONB,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create voice messages table for storing voice data
CREATE TABLE IF NOT EXISTS voice_messages (
    id SERIAL PRIMARY KEY,
    processing_id VARCHAR(255) UNIQUE NOT NULL,
    file_id VARCHAR(255),
    file_path VARCHAR(500),
    duration INTEGER,
    mime_type VARCHAR(100),
    file_size INTEGER,
    transcription TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create document uploads table for CSV files
CREATE TABLE IF NOT EXISTS document_uploads (
    id SERIAL PRIMARY KEY,
    processing_id VARCHAR(255) UNIQUE NOT NULL,
    file_id VARCHAR(255),
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    mime_type VARCHAR(100),
    file_size INTEGER,
    upload_status VARCHAR(50) DEFAULT 'pending',
    processed_trades INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create dialogs table for storing Telegram messages
CREATE TABLE IF NOT EXISTS dialogs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT NOT NULL,
    telegram_username VARCHAR(100),
    message_id BIGINT NOT NULL,
    chat_id BIGINT NOT NULL,
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text',
    is_from_bot BOOLEAN DEFAULT false,
    is_from_user BOOLEAN DEFAULT true,
    processing_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'received',
    raw_message JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create checklists table
CREATE TABLE IF NOT EXISTS checklists (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    items JSONB NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create screenshots table
CREATE TABLE IF NOT EXISTS screenshots (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_path VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trades_processing_id ON trades(processing_id);
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_trade_id ON ai_analysis(trade_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_processing_id ON ai_analysis(processing_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user_id ON ai_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_processing_id ON processing_logs(processing_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_chat_id ON processing_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_processing_logs_status ON processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_processing_logs_user_id ON processing_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_processing_id ON voice_messages(processing_id);
CREATE INDEX IF NOT EXISTS idx_voice_messages_user_id ON voice_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_processing_id ON document_uploads(processing_id);
CREATE INDEX IF NOT EXISTS idx_document_uploads_user_id ON document_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_checklists_user_id ON checklists(user_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_user_id ON screenshots(user_id);
CREATE INDEX IF NOT EXISTS idx_dialogs_user_id ON dialogs(user_id);
CREATE INDEX IF NOT EXISTS idx_dialogs_telegram_user_id ON dialogs(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_dialogs_chat_id ON dialogs(chat_id);
CREATE INDEX IF NOT EXISTS idx_dialogs_message_id ON dialogs(message_id);
CREATE INDEX IF NOT EXISTS idx_dialogs_processing_id ON dialogs(processing_id);
CREATE INDEX IF NOT EXISTS idx_dialogs_created_at ON dialogs(created_at);
CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for processing_logs
CREATE TRIGGER update_processing_logs_updated_at 
    BEFORE UPDATE ON processing_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for dialogs
CREATE TRIGGER update_dialogs_updated_at 
    BEFORE UPDATE ON dialogs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for testing (optional)
-- INSERT INTO processing_logs (processing_id, message_type, chat_id, user_id, username, raw_message, status)
-- VALUES ('test-123', 'text_message', 123456, 789, 'testuser', 'Test message', 'completed'); 