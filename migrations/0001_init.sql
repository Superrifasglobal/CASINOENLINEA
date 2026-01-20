-- Tabla de Usuarios
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    wallet_address TEXT UNIQUE,
    balance REAL DEFAULT 1000.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Apuestas (Auditoría)
CREATE TABLE bets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    game_type TEXT DEFAULT 'ruleta',
    bet_amount REAL,
    win_amount REAL,
    result_number INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);

-- Settings for RTP
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
