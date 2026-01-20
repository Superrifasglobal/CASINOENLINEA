-- Migration: Add Specific Admin User NEXJMR07@GMAIL.COM
-- Password is '29971627Nex@' (hashed)

INSERT OR IGNORE INTO users (id, username, email, password_hash, role, balance)
VALUES (
    'admin_nex', 
    'NEXJMR07@GMAIL.COM', 
    'NEXJMR07@GMAIL.COM', 
    '527dbe26a3f0bb837c7a0ccf1b1769d404b6f5ce6a2fda3fda9fdb69af449b89', 
    'admin', 
    1000000.0
);
