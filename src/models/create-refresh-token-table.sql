-- Create refresh_token table
CREATE TABLE IF NOT EXISTS refresh_token (
    token_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES user_account(user_id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_user_id ON refresh_token(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_token ON refresh_token(token);
