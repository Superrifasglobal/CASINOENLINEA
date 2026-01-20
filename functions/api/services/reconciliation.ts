export class ReconciliationService {
    constructor(private db: D1Database) { }

    async reconcileAllUsers() {
        // 1. Obtener todos los usuarios
        const users = await this.db.prepare('SELECT id, balance, initial_balance FROM users').all<{ id: string, balance: number, initial_balance: number }>();

        const results = [];

        for (const user of users.results) {
            const discrepancy = await this.checkUserDiscrepancy(user);
            if (discrepancy.hasDiscrepancy) {
                await this.flagUser(user.id, discrepancy.reason || 'Unknown discrepancy');
                results.push({ userId: user.id, ...discrepancy });
            }
        }

        return results;
    }

    private async checkUserDiscrepancy(user: { id: string, balance: number, initial_balance: number }) {
        // 2. Sumar todas las apuestas y premios
        // win_amount - bet_amount
        const betsStats = await this.db.prepare(
            'SELECT SUM(win_amount - bet_amount) as net_game FROM bets WHERE user_id = ?'
        ).bind(user.id).first<{ net_game: number }>();

        // 3. Sumar todos los depósitos y retiros
        // type = 'deposit' (+), type = 'withdrawal' (-)
        const txStats = await this.db.prepare(
            "SELECT SUM(CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END) as net_tx FROM transactions WHERE user_id = ?"
        ).bind(user.id).first<{ net_tx: number }>();

        const netGame = betsStats?.net_game || 0;
        const netTx = txStats?.net_tx || 0;

        // Cálculo esperado: Saldo Inicial + Ganancia neta juegos + Ganancia neta transacciones
        const expectedBalance = user.initial_balance + netGame + netTx;

        // Permitimos un margen de error pequeño por redondeo de reales (REAL en SQLite)
        const diff = Math.abs(user.balance - expectedBalance);
        const hasDiscrepancy = diff > 0.01;

        return {
            hasDiscrepancy,
            expected: expectedBalance,
            actual: user.balance,
            diff,
            reason: hasDiscrepancy ? `Discrepancia detectada: Esperado ${expectedBalance}, Actual ${user.balance}` : null
        };
    }

    private async flagUser(userId: string, reason: string) {
        console.warn(`[RECONCILIATION] Bloqueando usuario ${userId}: ${reason}`);

        // 4. Bloquear cuenta (UNDER_INVESTIGATION)
        await this.db.prepare(
            "UPDATE users SET status = 'UNDER_INVESTIGATION' WHERE id = ?"
        ).bind(userId).run();

        // 5. Opcional: Registrar log de auditoría
        await this.db.prepare(
            "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)"
        ).bind(`audit_flag_${userId}`, reason).run();
    }
}
