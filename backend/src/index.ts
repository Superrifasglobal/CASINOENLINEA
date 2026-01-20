export interface Env {
    DB: D1Database;
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId') || 'user_123';

        // Endpoints
        if (url.pathname === '/getBalance') {
            return handleGetBalance(userId, env);
        }

        if (url.pathname === '/placeBet' && request.method === 'POST') {
            const { amount } = await request.json() as { amount: number };
            return handlePlaceBet(userId, amount, env);
        }

        if (url.pathname === '/claimPrize' && request.method === 'POST') {
            const { amount } = await request.json() as { amount: number };
            return handleClaimPrize(userId, amount, env);
        }

        return new Response('Not Found', { status: 404 });
    },
};

async function handleGetBalance(userId: string, env: Env): Promise<Response> {
    const user = await env.DB.prepare('SELECT balance FROM users WHERE id = ?').bind(userId).first<{ balance: number }>();
    if (!user) return new Response('User not found', { status: 404 });

    return Response.json({ userId, balance: user.balance });
}

/**
 * handlePlaceBet uses an atomic SQL update to prevent race conditions.
 * The WHERE clause ensures the balance is sufficient before deducting.
 */
async function handlePlaceBet(userId: string, amount: number, env: Env): Promise<Response> {
    if (amount \<= 0) return new Response('Invalid amount', { status: 400 });

    const transactionId = crypto.randomUUID();

    try {
        // Atomic Update: Balance check + deduction in one step
        const result = await env.DB.prepare(`
			UPDATE users 
			SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
			WHERE id = ? AND balance >= ?
		`).bind(amount, userId, amount).run();

        if (result.meta.changes === 0) {
            return new Response('Insufficient funds or user not found', { status: 400 });
        }

        // Log Transaction
        await env.DB.prepare(`
			INSERT INTO transactions (id, user_id, type, amount, created_at) 
			VALUES (?, ?, 'bet', ?, CURRENT_TIMESTAMP)
		`).bind(transactionId, userId, amount).run();

        return Response.json({ success: true, transactionId, betAmount: amount });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
}

async function handleClaimPrize(userId: string, amount: number, env: Env): Promise<Response> {
    if (amount \<= 0) return new Response('Invalid amount', { status: 400 });

    const transactionId = crypto.randomUUID();

    try {
        await env.DB.prepare(`
			UPDATE users 
			SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP 
			WHERE id = ?
		`).bind(amount, userId).run();

        await env.DB.prepare(`
			INSERT INTO transactions (id, user_id, type, amount, created_at) 
			VALUES (?, ?, 'prize', ?, CURRENT_TIMESTAMP)
		`).bind(transactionId, userId, amount).run();

        return Response.json({ success: true, transactionId, prizeAmount: amount });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
}
