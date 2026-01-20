-- Tabla de Transacciones
CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    type TEXT CHECK(type IN ('deposit', 'withdrawal')),
    amount REAL,
    status TEXT CHECK(status IN ('pending', 'completed', 'rejected')),
    tx_hash TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
