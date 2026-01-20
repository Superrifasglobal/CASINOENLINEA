-- Standardized Casino Schema for Cloudflare D1

-- 1. Table for Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    wallet_address TEXT UNIQUE,
    balance REAL NOT NULL DEFAULT 0.0,
    role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
    status TEXT CHECK(status IN ('ACTIVE', 'BANNED')) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Table for Game Configuration
CREATE TABLE IF NOT EXISTS games_config (
    game_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    rtp_percentage REAL NOT NULL, -- e.g., 0.95 for 95%
    min_bet REAL NOT NULL DEFAULT 0.1,
    max_bet REAL NOT NULL DEFAULT 1000.0,
    is_active INTEGER DEFAULT 1, -- 1 for true, 0 for false
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Table for Bets (History with Balance Tracking)
CREATE TABLE IF NOT EXISTS bets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    game_id TEXT NOT NULL,
    amount REAL NOT NULL,
    payout REAL DEFAULT 0.0,
    balance_before REAL NOT NULL,
    balance_after REAL NOT NULL,
    status TEXT CHECK(status IN ('win', 'loss', 'pending')) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(game_id) REFERENCES games_config(game_id)
);

-- 4. Table for Admin Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS admin_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL, -- e.g., 'ban_user', 'change_rtp', 'adjust_balance'
    target_id TEXT, -- ID of the user or game modified
    details TEXT, -- JSON or string with extra info
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(admin_id) REFERENCES users(id)
);

-- Initial Mock Data
INSERT OR IGNORE INTO users (id, username, wallet_address, balance, role) 
VALUES ('admin_root', 'AdminMaster', '0x123...admin', 0.0, 'admin');

INSERT OR IGNORE INTO games_config (game_id, name, rtp_percentage, min_bet, max_bet) 
VALUES ('roulette_01', 'Neon Roulette', 0.97, 1.0, 500.0);

INSERT OR IGNORE INTO games_config (game_id, name, rtp_percentage, min_bet, max_bet) 
VALUES ('slots_neon', 'Cyber Slots', 0.95, 0.2, 100.0);
