-- Migration number: 0009 	 2026-01-20T06:12:00
-- Description: Add signup_ip column to users table for abuse prevention

ALTER TABLE users ADD COLUMN signup_ip TEXT;

-- Create index for fast lookups during registration
CREATE INDEX IF NOT EXISTS idx_users_signup_ip ON users(signup_ip);
