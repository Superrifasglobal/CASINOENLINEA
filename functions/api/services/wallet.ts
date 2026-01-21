import { parseEther, formatEther } from 'viem';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    ETH_RPC_URL: string;
    HOUSE_WALLET: string;
}

export class WalletService {
    constructor(private supabase: SupabaseClient, private env: Env) { }

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
            const { data: existing } = await this.supabase
                .from('transactions')
                .select('id')
                .eq('metadata->>tx_hash', txHash)
                .single();

            if (existing) throw new Error('Transacción ya procesada');

            // 3. Actualizar saldo y registrar transacción
            const { data: profile } = await this.supabase
                .from('profiles')
                .select('balance')
                .eq('id', userId)
                .single();

            const { error: updateError } = await this.supabase
                .from('profiles')
                .update({ balance: (profile?.balance || 0) + Number(actualAmount) })
                .eq('id', userId);

            if (updateError) throw new Error('Error al actualizar saldo');

            await this.supabase.from('transactions').insert({
                user_id: userId,
                type: 'deposit',
                amount: Number(actualAmount),
                status: 'completed',
                metadata: { tx_hash: txHash }
            });

            return { success: true, amount: actualAmount };
        } catch (error: any) {
            console.error('Verify Deposit Error:', error);
            throw error;
        }
    }

    async initiateWithdrawal(userId: string, amount: number, destinationWallet: string) {
        if (amount <= 0) throw new Error('Monto inválido');

        // 1. Verificar saldo
        const { data: user, error } = await this.supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (error || !user || user.balance < amount) {
            throw new Error('Saldo insuficiente');
        }

        // 2. Descontar saldo inmediatamente y registrar retiro como 'pending'
        const { error: withdrawError } = await this.supabase
            .from('profiles')
            .update({ balance: user.balance - amount })
            .eq('id', userId);

        if (withdrawError) throw new Error('Error al procesar el retiro');

        await this.supabase.from('transactions').insert({
            user_id: userId,
            type: 'withdrawal',
            amount: amount,
            status: 'pending',
            metadata: {
                destination: destinationWallet,
                tx_hash: `pending_${Date.now()}`
            }
        });

        // 3. Alerta para administración (Simulado con un log, podría ser un webhook de Slack/Discord)
        console.log(`[ALERTA ADMIN] Retiro solicitado: Usuario ${userId}, Monto ${amount} ETH, Destino ${destinationWallet}`);

        return { success: true, message: 'Retiro solicitado exitosamente. Pendiente de aprobación.' };
    }
}
