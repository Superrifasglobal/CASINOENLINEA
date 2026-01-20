import { parseEther, formatEther } from 'viem';

export interface Env {
    DB: D1Database;
    ETH_RPC_URL: string;
    HOUSE_WALLET: string;
}

export class WalletService {
    constructor(private env: Env) { }

    async verifyDeposit(userId: string, txHash: string, expectedAmount: string) {
        // 1. Verificar transacción on-chain
        // Nota: Usamos fetch para llamar a un RPC de Ethereum (ej. Alchemy o Infura)
        // En un entorno real, ETH_RPC_URL debe estar en wrangler.toml
        const rpcUrl = this.env.ETH_RPC_URL || 'https://cloudflare-eth.com';

        try {
            const response = await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'eth_getTransactionByHash',
                    params: [txHash],
                }),
            });

            const data: any = await response.json();
            const tx = data.result;

            if (!tx) throw new Error('Transacción no encontrada');
            if (tx.to.toLowerCase() !== this.env.HOUSE_WALLET.toLowerCase()) {
                throw new Error('Destino incorrecto');
            }

            const actualAmount = formatEther(BigInt(tx.value));
            if (actualAmount !== expectedAmount) {
                throw new Error(`Monto no coincide. Esperado: ${expectedAmount}, Recibido: ${actualAmount}`);
            }

            // 2. Verificar si ya fue procesada para evitar doble acreditación
            const existing = await this.env.DB.prepare(
                'SELECT id FROM transactions WHERE tx_hash = ?'
            ).get(txHash);

            if (existing) throw new Error('Transacción ya procesada');

            // 3. Actualizar saldo y registrar transacción (Atómico)
            const operations = [
                this.env.DB.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(Number(actualAmount), userId),
                this.env.DB.prepare(
                    'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)'
                ).bind(userId, 'deposit', Number(actualAmount), 'completed', txHash)
            ];

            await this.env.DB.batch(operations);

            return { success: true, amount: actualAmount };
        } catch (error: any) {
            console.error('Verify Deposit Error:', error);
            throw error;
        }
    }

    async initiateWithdrawal(userId: string, amount: number, destinationWallet: string) {
        if (amount <= 0) throw new Error('Monto inválido');

        // 1. Verificar saldo
        const user = await this.env.DB.prepare('SELECT balance FROM users WHERE id = ?').get<{ balance: number }>(userId);
        if (!user || user.balance < amount) {
            throw new Error('Saldo insuficiente');
        }

        // 2. Descontar saldo inmediatamente y registrar retiro como 'pending'
        // Esto evita double spending
        const operations = [
            this.env.DB.prepare('UPDATE users SET balance = balance - ? WHERE id = ? AND balance >= ?').bind(amount, userId, amount),
            this.env.DB.prepare(
                'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)'
            ).bind(userId, 'withdrawal', amount, 'pending', `pending_${Date.now()}`)
        ];

        const result = await this.env.DB.batch(operations);

        // Si la primera operación no afectó ninguna fila, el saldo cambió entre la lectura y la escritura
        if (result[0].meta.changes === 0) {
            throw new Error('Error al procesar el retiro (posible cambio de saldo)');
        }

        // 3. Alerta para administración (Simulado con un log, podría ser un webhook de Slack/Discord)
        console.log(`[ALERTA ADMIN] Retiro solicitado: Usuario ${userId}, Monto ${amount} ETH, Destino ${destinationWallet}`);

        return { success: true, message: 'Retiro solicitado exitosamente. Pendiente de aprobación.' };
    }
}
