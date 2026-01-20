import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';
import { crypto } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Database setup (Simulation of D1)
const dbPath = process.env.DATABASE_PATH || './casino.db';
const db = new Database(dbPath);

// Initialize DB schema if not exists
// Note: We expect migrations to be available
const migrationsDir = path.join(__dirname, 'migrations');
if (fs.existsSync(migrationsDir)) {
    const files = fs.readdirSync(migrationsDir).sort();
    files.forEach(file => {
        if (file.endsWith('.sql')) {
            const schema = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            db.exec(schema);
        }
    });
}

// --- API Endpoints (Adapted from functions/api/[[path]].ts) ---

app.get('/api/getBalance', (req, res) => {
    const userId = req.query.userId || 'user_123';
    try {
        const row = db.prepare('SELECT balance, status FROM users WHERE id = ?').get(userId);
        if (!row) return res.status(404).json({ error: 'User not found' });
        if (row.status === 'BANNED') return res.status(403).json({ error: 'Account banned' });
        res.json({ userId, balance: row.balance });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/roulette/spin', (req, res) => {
    const { userId, amount, betType, betValue } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid bet amount' });

    try {
        const debit = db.prepare('UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND balance >= ? AND status = "ACTIVE"')
            .run(amount, userId, amount);

        if (debit.changes === 0) return res.status(400).json({ error: 'Insufficient funds or account inactive' });

        const winningNumber = Math.floor(Math.random() * 37);
        const win = (betType === 'straight' && parseInt(betValue) === winningNumber);
        const payout = win ? amount * 35 : 0;

        if (win) {
            db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(payout, userId);
        }

        const txId = crypto.randomUUID();
        db.prepare('INSERT INTO transactions (id, user_id, type, amount, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
            .run(txId, userId, 'bet', amount);

        if (win) {
            db.prepare('INSERT INTO transactions (id, user_id, type, amount, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
                .run(crypto.randomUUID(), userId, 'prize', payout);
        }

        const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

        res.json({
            win,
            number: winningNumber,
            payout,
            txId,
            newBalance: user?.balance
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Serve frontend static files
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
