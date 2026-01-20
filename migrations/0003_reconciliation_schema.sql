-- Asegurar que la tabla users tenga la columna de estado necesaria
-- Y agregar una columna de saldo inicial si no existe para mejorar la precisión del cálculo
ALTER TABLE users ADD COLUMN status TEXT CHECK(status IN ('ACTIVE', 'BANNED', 'UNDER_INVESTIGATION')) DEFAULT 'ACTIVE';
ALTER TABLE users ADD COLUMN initial_balance REAL DEFAULT 0.0;
