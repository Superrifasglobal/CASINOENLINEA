-- Tabla para persistir estados de Blackjack entre peticiones
CREATE TABLE blackjack_games (
    user_id TEXT PRIMARY KEY,
    state TEXT, -- JSON con { deck, playerHand, dealerHand, status, bet }
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
);
