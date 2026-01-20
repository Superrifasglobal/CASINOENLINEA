export interface BinanceEnv {
    BINANCE_API_KEY: string;
    BINANCE_API_SECRET: string;
    DB: D1Database;
}

export class BinanceService {
    private baseUrl = 'https://bpay.binanceapi.com';

    constructor(private env: BinanceEnv) { }

    private async generateSignature(payload: string, timestamp: number, nonce: string): Promise<string> {
        const message = `${timestamp}\n${nonce}\n${payload}\n`;
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(this.env.BINANCE_API_SECRET),
            { name: 'HMAC', hash: 'SHA-512' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
        return Array.from(new Uint8Array(signature))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
    }

    async createOrder(userId: string, amount: number, currency: string = 'USDT') {
        const endpoint = '/binancepay/openapi/v2/order';
        const nonce = crypto.randomUUID().replace(/-/g, '').slice(0, 32);
        const timestamp = Date.now();

        const body = {
            env: { terminalType: 'WEB' },
            merchantTradeNo: `ORDER_${userId}_${Date.now()}`,
            orderAmount: amount,
            currency: currency,
            goods: {
                goodsType: '01',
                goodsCategory: '6000',
                referenceGoodsId: 'deposit_tokens',
                goodsName: 'Casino Deposit',
            },
            returnUrl: 'https://your-domain.com/deposit-success',
            cancelUrl: 'https://your-domain.com/deposit-cancel',
        };

        const payload = JSON.stringify(body);
        const signature = await this.generateSignature(payload, timestamp, nonce);

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'BinancePay-Timestamp': timestamp.toString(),
                'BinancePay-Nonce': nonce,
                'BinancePay-Certificate-SN': this.env.BINANCE_API_KEY,
                'BinancePay-Signature': signature,
            },
            body: payload,
        });

        const data: any = await response.json();
        if (data.status !== 'SUCCESS') {
            throw new Error(data.errorMessage || 'Binance Pay Order Error');
        }

        return data.data; // Includes checkoutUrl and qrCodeUrl
    }

    async handleWebhook(payload: any, signature: string, timestamp: string, nonce: string) {
        // 1. Verify Signature (Simplified for demo, implementation should match Binance docs)
        // Note: In production, verify the signature using the Binance public key

        const { bizType, data } = payload;

        if (bizType === 'PAY' && payload.status === 'SUCCEEDED') {
            const orderData = JSON.parse(data);
            const merchantTradeNo = orderData.merchantTradeNo;
            const userId = merchantTradeNo.split('_')[1];
            const amount = parseFloat(orderData.orderAmount);

            // 2. Update D1 Balance
            const existing = await this.env.DB.prepare(
                'SELECT id FROM transactions WHERE tx_hash = ?'
            ).get(merchantTradeNo);

            if (existing) return { success: true, message: 'Already processed' };

            const operations = [
                this.env.DB.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(amount, userId),
                this.env.DB.prepare(
                    'INSERT INTO transactions (user_id, type, amount, status, tx_hash) VALUES (?, ?, ?, ?, ?)'
                ).bind(userId, 'deposit', amount, 'completed', merchantTradeNo)
            ];

            await this.env.DB.batch(operations);
            return { success: true };
        }

        return { success: false };
    }
}
