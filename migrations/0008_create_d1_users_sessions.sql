-- Migration number: 0008 	 2026-01-20T06:05:08
-- Description: Create users and sessions tables for D1 authentication

-- Drop existing tables if they exist to ensure clean state (Optional, remove if maintaining data is required)
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS users;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,               -- UUID will be stored as TEXT
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    balance REAL DEFAULT 0,            -- Using REAL for decimal balance in SQLite
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_verified INTEGER DEFAULT 0,     -- SQLite uses 0/1 for booleans
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions Table for Multi-device Login
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,               -- Session UUID
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,        -- Session token
    device_info TEXT,                  -- Optional: User Agent or Device Name
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
