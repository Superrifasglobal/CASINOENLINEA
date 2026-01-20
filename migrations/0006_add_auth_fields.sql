-- Migration: 0006_add_auth_fields.sql
-- Adds necessary authentication and profile fields to the users table

-- 1. Add missing auth columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- 2. Create index for email lookup
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Ensure a primary admin exists for testing (optional/safe)
-- Default pass: 29971627Nex@
INSERT OR IGNORE INTO users (id, username, email, password_hash, role, balance)
VALUES (
    'admin_v1', 
    'admin', 
    'admin@antigravity.bet', 
    '527dbe26a3f0bb837c7a0ccf1b1769d404b6f5ce6a2fda3fda9fdb69af449b89', 
    'ADMIN', 
    1000000.0
);
