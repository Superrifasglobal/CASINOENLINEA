-- Migration: Add Authentication Fields
-- Adds password hashing and basic role support if not fully present

ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN email TEXT;

-- Index for faster login lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Ensure admin account exists
-- Password will be "29971627Nex@" (hashed below)
INSERT OR IGNORE INTO users (id, username, password_hash, role, balance)
VALUES ('admin_primary', 'admin', '527dbe26a3f0bb837c7a0ccf1b1769d404b6f5ce6a2fda3fda9fdb69af449b89', 'admin', 999999.0);
