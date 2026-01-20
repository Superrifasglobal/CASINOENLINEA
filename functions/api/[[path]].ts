export interface Env {
    DB: D1Database;
    JWT_SECRET: string;
    PRESENCE: DurableObjectNamespace;
    ETH_RPC_URL: string;
    HOUSE_WALLET: string;
    DISCORD_WEBHOOK_URL?: string;
    ADMIN_PRIVATE_KEY: string;
    CASINO_CONTRACT_ADDRESS: string;
}

import { WalletService } from './services/wallet';
import { BinanceService } from './services/binance';
import { RouletteEngine } from './services/roulette';
import { SlotEngine } from './services/slots';
import { XPService, RANKS } from './services/xp';
import { AdminContractService } from './services/contract';
import { BlackjackService } from './services/blackjack';
export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || 'user_123';

    // 1. PUBLIC Endpoints (no auth for demo, but typically would have user auth)
    if (url.pathname === '/api/getBalance') return handleGetBalance(userId, env);
    if (url.pathname === '/api/roulette/spin' && request.method === 'POST') {
        const { amount, betType, betValue } = await request.json() as { amount: number, betType: string, betValue: string | number };
        return handleRouletteSpin(userId, amount, betType, betValue, env);
    }
    if (url.pathname === '/api/getXP') return handleGetXP(userId, env);
    if (url.pathname === '/api/placeBet' && request.method === 'POST') {
        const { amount } = await request.json() as { amount: number };
        return handlePlaceBet(userId, amount, env);
    }
    if (url.pathname === '/api/claimPrize' && request.method === 'POST') {
        const { amount, seed } = await request.json() as { amount: number, seed: string };
        const response = await handleClaimPrize(userId, amount, env);

        // Audit high-value wins (> $100) or suspicious patterns
        if (response.status === 200 && amount > 100) {
            await auditLogger(userId, amount, seed, request, env);
        }

        return response;
    }

    // 2. WALLET Endpoints
    const walletService = new WalletService(env);
    if (url.pathname === '/api/verify-deposit' && request.method === 'POST') {
        const { txHash, amount } = await request.json() as { txHash: string, amount: string };
        try {
            const result = await walletService.verifyDeposit(userId, txHash, amount);
            return Response.json(result);
        } catch (e: any) {
            return new Response(e.message, { status: 400 });
        }
    }
    if (url.pathname === '/api/withdraw' && request.method === 'POST') {
        const { amount, destinationWallet } = await request.json() as { amount: number, destinationWallet: string };
        try {
            const result = await walletService.initiateWithdrawal(userId, amount, destinationWallet);
            return Response.json(result);
        } catch (e: any) {
            return new Response(e.message, { status: 400 });
        }
    }

    // Binance Pay Endpoints
    const binanceService = new BinanceService(env as any);
    if (url.pathname === '/api/binance/create' && request.method === 'POST') {
        const { amount, currency } = await request.json() as { amount: number, currency: string };
        try {
            const result = await binanceService.createOrder(userId, amount, currency);
            return Response.json(result);
        } catch (e: any) {
            return new Response(e.message, { status: 400 });
        }
    }
    if (url.pathname === '/api/binance/webhook' && request.method === 'POST') {
        const payload = await request.json();
        const signature = request.headers.get('BinancePay-Signature') || '';
        const timestamp = request.headers.get('BinancePay-Timestamp') || '';
        const nonce = request.headers.get('BinancePay-Nonce') || '';
        try {
            const result = await binanceService.handleWebhook(payload, signature, timestamp, nonce);
            return Response.json(result);
        } catch (e: any) {
            return new Response(e.message, { status: 400 });
        }
    }

    // 3. ADMIN Endpoints (JWT Protected)
    if (url.pathname.startsWith('/api/admin/')) {
        const authError = await verifyAdmin(request, env);
        if (authError) return authError;

        if (url.pathname === '/api/admin/stats') return handleGetStats(env);
        if (url.pathname === '/api/admin/update-odds' && request.method === 'POST') {
            const { rtp } = await request.json() as { rtp: number };
            return handleUpdateRTP(rtp, env);
        }
        if (url.pathname === '/api/admin/user-action' && request.method === 'POST') {
            const data = await request.json() as { targetUserId: string, action: string, value?: number };
            return handleUserAction(data, env);
        }
        // Roulette Admin
        if (url.pathname === '/api/admin/roulette/rtp' && request.method === 'POST') {
            const { rtp, bias } = await request.json() as { rtp: number, bias?: number };
            return handleUpdateRouletteRTP(rtp, bias, env);
        }
        if (url.pathname === '/api/admin/roulette/history') {
            return handleGetRouletteHistory(env);
        }
        if (url.pathname === '/api/admin/system/live') {
            return handleGetLiveCount(env);
        }

        // 4. BLACKJACK Endpoints
        const blackjackService = new BlackjackService(env.DB);
        const userId = url.searchParams.get('userId') || 'guest';

        if (url.pathname === '/api/blackjack/start' && request.method === 'POST') {
            const { bet } = await request.json() as any;
            const state = await blackjackService.initGame(userId, bet);
            await blackjackService.saveGameState(userId, state);
            return Response.json({ success: true, state });
        }

        if (url.pathname === '/api/blackjack/hit' && request.method === 'POST') {
            let state = await blackjackService.getGameState(userId);
            if (!state) return new Response('No active game', { status: 400 });
            state = await blackjackService.hit(state);
            await blackjackService.saveGameState(userId, state);
            return Response.json({ success: true, state });
        }

        if (url.pathname === '/api/blackjack/stand' && request.method === 'POST') {
            let state = await blackjackService.getGameState(userId);
            if (!state) return new Response('No active game', { status: 400 });
            state = await blackjackService.stand(state);

            // Process winnings if game ended
            if (state.status !== 'playing') {
                let multiplier = 0;
                if (state.status === 'player_win') multiplier = 2;
                if (state.status === 'blackjack') multiplier = 2.5;
                if (state.status === 'push') multiplier = 1;

                const winAmount = state.bet * multiplier;

                // Update D1: Balance, Bets history, and XP
                const xpService = new XPService(env.DB);
                const operations = [
                    env.DB.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(winAmount, userId),
                    env.DB.prepare('INSERT INTO bets (user_id, game_type, bet_amount, win_amount, timestamp) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
                        .bind(userId, 'blackjack', state.bet, winAmount)
                ];
                await env.DB.batch(operations);
                await xpService.addXP(userId, state.bet);

                await blackjackService.clearGameState(userId);
            } else {
                await blackjackService.saveGameState(userId, state);
            }
            return Response.json({ success: true, state });
        }

        // New Admin Endpoints
        if (url.pathname === '/api/admin/vault') return handleGetVaultStats(env);
        if (url.pathname === '/api/admin/users-list') {
            const page = parseInt(url.searchParams.get('page') || '1');
            return handleGetUsersList(page, env);
        }

        // Contract Admin Endpoints
        const contractService = new AdminContractService(env);
        if (url.pathname === '/api/admin/contract/stats') {
            const report = await contractService.getAuditReport();
            return Response.json({ success: true, ...report });
        }
        if (url.pathname === '/api/admin/contract/withdraw' && request.method === 'POST') {
            const { to, amount } = await request.json() as any;
            try {
                const hash = await contractService.adminWithdraw(to, amount);
                return Response.json({ success: true, txHash: hash });
            } catch (e: any) {
                return new Response(e.message, { status: 400 });
            }
        }
    }

    return new Response('Not Found', { status: 404 });
};

const slotEngine = new SlotEngine();

async function auditLogger(userId: string, amount: number, seed: string, request: Request, env: Env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const id = crypto.randomUUID();

    await env.DB.prepare('INSERT INTO audit_logs (id, user_id, ip, amount, seed, reason) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, userId, ip, amount, seed, 'High value win detected').run();

    // Pattern detection: 5 wins in last minute
    const recentWins = await env.DB.prepare(`
		SELECT COUNT(*) as count FROM transactions 
		WHERE user_id = ? AND type = 'prize' AND created_at >= datetime('now', '-1 minute')
	`).bind(userId).first<{ count: number }>();

    if (recentWins && recentWins.count >= 5) {
        await notifyFraud(userId, recentWins.count, env);
    }
}

async function notifyFraud(userId: string, count: number, env: Env) {
    const webhookUrl = env.DISCORD_WEBHOOK_URL || "https://discord.com/api/webhooks/dummy"; // Use env variable if available
    const payload = {
        content: `🚨 **ALERTA DE FRAUDE** 🚨\nUsuario: \`${userId}\` ha ganado **${count} veces** en el último minuto.\nAcción recomendada: Revisar cuenta o baneo temporal.`,
        username: "Casino Sentinel"
    };

    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (e) {
        console.error('Failed to send fraud alert', e);
    }
}

/**
 * Poor man's JWT verification (Demo purposes, usually uses a library)
 */
async function verifyAdmin(request: Request, env: Env): Promise<Response | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
    }
    // In production, use `jose` or similar library to verify JWT
    // Here we simulate checking if the role is ADMIN from a decoded payload
    // For this demo, we accept any token if it's "ADMIN_TOKEN"
    if (authHeader !== 'Bearer ADMIN_TOKEN') {
        return new Response('Forbidden: Admin only', { status: 403 });
    }
    return null;
}

async function handleRouletteSpin(userId: string, betAmount: number, betType: string, betValue: string | number, env: Env): Promise<Response> {
    if (betAmount <= 0) return new Response('Invalid bet amount', { status: 400 });

    const engine = new RouletteEngine();

    // 1. Debit User (Atomic)
    const debit = await env.DB.prepare('UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND balance >= ? AND status = "ACTIVE"')
        .bind(betAmount, userId, betAmount).run();

    if (debit.meta.changes === 0) return new Response('Insufficient funds or account inactive', { status: 400 });

    // 2. Generate Result
    const result = engine.spin(betType, betValue, betAmount);

    // 3. Record Bet and Result (Using bets table for game history consistency)
    const txId = crypto.randomUUID();
    // Assuming 'roulette' as game_id
    await env.DB.prepare('INSERT INTO bets (id, user_id, game_id, amount, payout, status) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(txId, userId, 'roulette', betAmount, result.payout, result.win ? 'win' : 'loss').run();

    // 5. XP System Integration
    const xpService = new XPService(env.DB);
    const xpResult = await xpService.addXP(userId, betAmount);

    // 6. Automatic Cashback on losses
    if (!result.win) {
        await xpService.applyCashback(userId, betAmount);
    }

    // 7. Return Result + New Balance + XP Info
    const user = await env.DB.prepare('SELECT balance, level, xp FROM users WHERE id = ?').bind(userId).first<{ balance: number, level: number, xp: number }>();

    return Response.json({
        ...result,
        txId,
        newBalance: user?.balance,
        xpInfo: {
            xp: user?.xp,
            level: user?.level,
            rank: xpResult?.rank
        }
    });
}

async function handleSlotSpin(userId: string, betAmount: number, env: Env): Promise<Response> {
    if (betAmount <= 0) return new Response('Invalid bet', { status: 400 });

    // 1. Get Global RTP from D1
    const rtpSetting = await env.DB.prepare('SELECT value FROM settings WHERE key = ?')
        .bind('global_rtp').first<{ value: string }>();
    const rtp = rtpSetting ? parseFloat(rtpSetting.value) : 0.95;

    // 2. Debit User atómica
    const debit = await env.DB.prepare('UPDATE users SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND balance >= ? AND status = "ACTIVE"')
        .bind(betAmount, userId, betAmount).run();

    if (debit.meta.changes === 0) return new Response('Insufficient funds or account inactive', { status: 400 });

    // 3. Generate Result on Server
    const result = slotEngine.spin(rtp);
    const winAmount = betAmount * result.payoutMultiplier;

    // 4. Record Bet and possible Prize
    const txId = crypto.randomUUID();
    await env.DB.prepare('INSERT INTO bets (id, user_id, game_id, amount, payout, status) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(txId, userId, 'slots_neon', betAmount, winAmount, result.win ? 'win' : 'loss').run();

    if (result.win) {
        await env.DB.prepare('UPDATE users SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
            .bind(winAmount, userId).run();
    }

    // 5. XP System Integration
    const xpService = new XPService(env.DB);
    const xpResult = await xpService.addXP(userId, betAmount);

    // 6. Automatic Cashback on losses
    if (winAmount < betAmount) {
        await xpService.applyCashback(userId, betAmount - winAmount);
    }

    const user = await env.DB.prepare('SELECT balance, level, xp FROM users WHERE id = ?').bind(userId).first<{ balance: number, level: number, xp: number }>();

    return Response.json({
        ...result,
        txId,
        winAmount,
        newBalance: user?.balance,
        xpInfo: {
            xp: user?.xp,
            level: user?.level,
            rank: xpResult?.rank
        }
    });
}

// ADMIN HANDLERS
async function handleGetStats(env: Env): Promise<Response> {
    const stats = await env.DB.prepare(`
		SELECT 
			SUM(CASE WHEN type = 'bet' THEN amount ELSE 0 END) as total_bet,
			SUM(CASE WHEN type = 'prize' THEN amount ELSE 0 END) as total_paid,
			(SUM(CASE WHEN type = 'bet' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'prize' THEN amount ELSE 0 END)) as ggr
		FROM transactions 
		WHERE created_at >= datetime('now', '-24 hours')
	`).first();

    return Response.json({ success: true, stats });
}

async function handleUpdateRTP(rtp: number, env: Env): Promise<Response> {
    if (rtp < 0 || rtp > 1) return new Response('RTP must be between 0 and 1', { status: 400 });
    await env.DB.prepare('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?')
        .bind(rtp.toString(), 'global_rtp').run();
    return Response.json({ success: true, new_rtp: rtp });
}

async function handleUserAction(data: any, env: Env): Promise<Response> {
    const { targetUserId, action, value } = data;
    if (action === 'ban') {
        await env.DB.prepare('UPDATE users SET status = "BANNED" WHERE id = ?').bind(targetUserId).run();
    } else if (action === 'adjust' && value !== undefined) {
        await env.DB.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').bind(value, targetUserId).run();
    } else {
        return new Response('Invalid action', { status: 400 });
    }
    return Response.json({ success: true, action, targetUserId });
}

async function handleUpdateRouletteRTP(rtp: number, bias: number = 0, env: Env): Promise<Response> {
    // Validar RTP (0.0 - 1.0)
    if (rtp < 0 || rtp > 1) return new Response('Invalid RTP', { status: 400 });

    await env.DB.prepare('INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at')
        .bind('roulette_rtp_bias', rtp.toString()).run();

    return Response.json({ success: true, rtp });
}

async function handleGetRouletteHistory(env: Env): Promise<Response> {
    const history = await env.DB.prepare(`
        SELECT id, game_type, bet_amount as amount, win_amount as payout, 
        CASE WHEN win_amount > 0 THEN 'win' ELSE 'loss' END as status, 
        timestamp as created_at 
        FROM bets 
        WHERE game_type = 'ruleta' 
        ORDER BY timestamp DESC 
        LIMIT 50
    `).all();
    return Response.json({ success: true, history: history.results });
}

async function handleGetLiveCount(env: Env): Promise<Response> {
    const id = env.PRESENCE.idFromName('global_counter');
    const obj = env.PRESENCE.get(id);
    const resp = await obj.fetch('http://do/count'); // Internal DO fetch
    return resp;
}

async function handleGetVaultStats(env: Env): Promise<Response> {
    // 1. Get Total House Wallet Balance (Simulated or via RPC if needed)
    // For this demo, let's assume we sum all transactions
    const balances = await env.DB.prepare(`
        SELECT 
            SUM(CASE WHEN type IN ('deposit', 'bet') THEN amount WHEN type IN ('withdrawal', 'prize') THEN -amount ELSE 0 END) as total_balance,
            (SELECT SUM(balance) FROM users) as player_debts
        FROM transactions
    `).first<{ total_balance: number, player_debts: number }>();

    const totalWallet = balances?.total_balance || 0;
    const playerDebts = balances?.player_debts || 0;
    const retirableProfit = Math.max(0, totalWallet - playerDebts);

    return Response.json({
        success: true,
        vault: {
            totalWallet,
            playerDebts,
            retirableProfit
        }
    });
}

async function handleGetUsersList(page: number, env: Env): Promise<Response> {
    const limit = 10;
    const offset = (page - 1) * limit;

    const users = await env.DB.prepare(`
        SELECT u.id, u.balance, u.status, u.xp, u.level,
        (SELECT MAX(created_at) FROM bets WHERE user_id = u.id) as last_bet,
        (SELECT SUM(win_amount - bet_amount) FROM bets WHERE user_id = u.id) as total_profit
        FROM users u
        ORDER BY u.balance DESC
        LIMIT ? OFFSET ?
    `).bind(limit, offset).all();

    return Response.json({ success: true, users: users.results, page });
}

async function handleGetXP(userId: string, env: Env): Promise<Response> {
    const user = await env.DB.prepare('SELECT xp, level FROM users WHERE id = ?').bind(userId).first<{ xp: number, level: number }>();
    if (!user) return new Response('User not found', { status: 404 });

    const xpService = new XPService(env.DB);
    const rank = xpService.getRankInfo(user.level, user.xp);

    return Response.json({
        userId,
        xp: user.xp,
        level: user.level,
        rank
    });
}

// USER HANDLERS (Previous logic)
async function handleGetBalance(userId: string, env: Env): Promise<Response> {
    const user = await env.DB.prepare('SELECT balance, status FROM users WHERE id = ?').bind(userId).first<{ balance: number, status: string }>();
    if (!user) return new Response('User not found', { status: 404 });
    if (user.status === 'BANNED') return new Response('Account banned', { status: 403 });

    return Response.json({ userId, balance: user.balance });
}

async function handlePlaceBet(userId: string, amount: number, env: Env): Promise<Response> {
    if (amount <= 0) return new Response('Invalid amount', { status: 400 });

    try {
        const result = await env.DB.prepare(`
			UPDATE users 
			SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
			WHERE id = ? AND balance >= ? AND status = 'ACTIVE'
		`).bind(amount, userId, amount).run();

        if (result.meta.changes === 0) {
            return new Response('Insufficient funds, banned or user not found', { status: 400 });
        }

        await env.DB.prepare(`
			INSERT INTO transactions (id, user_id, type, amount, created_at) 
			VALUES (?, ?, 'bet', ?, CURRENT_TIMESTAMP)
		`).bind(crypto.randomUUID(), userId, amount).run();

        // XP System Integration
        const xpService = new XPService(env.DB);
        await xpService.addXP(userId, amount);

        return Response.json({ success: true, betAmount: amount });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
}

async function handleClaimPrize(userId: string, amount: number, env: Env): Promise<Response> {
    if (amount <= 0) return new Response('Invalid amount', { status: 400 });

    try {
        const result = await env.DB.prepare(`
			UPDATE users 
			SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP 
			WHERE id = ? AND status = 'ACTIVE'
		`).bind(amount, userId).run();

        if (result.meta.changes === 0) return new Response('User banned or not found', { status: 400 });

        await env.DB.prepare(`
			INSERT INTO transactions (id, user_id, type, amount, created_at) 
			VALUES (?, ?, 'prize', ?, CURRENT_TIMESTAMP)
		`).bind(crypto.randomUUID(), userId, amount).run();

        return Response.json({ success: true, prizeAmount: amount });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
}
