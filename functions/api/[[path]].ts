import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Env {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    PRESENCE: DurableObjectNamespace;
    ETH_RPC_URL: string;
    HOUSE_WALLET: string;
    DISCORD_WEBHOOK_URL?: string;
    ADMIN_PRIVATE_KEY: string;
    CASINO_CONTRACT_ADDRESS: string;
    DB: D1Database; // Kept for DO/Blackjack compatibility if needed, but most logic moved to Supabase
}

const getSupabase = (env: Env): SupabaseClient => {
    return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
};

import { WalletService } from './services/wallet';
import { BinanceService } from './services/binance';
import { RouletteEngine } from './services/roulette';
import { SlotEngine } from './services/slots';
import { XPService, RANKS } from './services/xp';
import { AdminContractService } from './services/contract';
import { BlackjackService } from './services/blackjack';
import { MinesService } from './services/mines';
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const supabase = getSupabase(env);

        // 0. AUTH Endpoints (Legacy or Bridge)
        // Note: In the hybrid model, registration/login happens on the frontend via Firebase.
        // These worker endpoints might be deprecated or used for specific server-side auth.
        if (url.pathname === '/api/auth/register' && request.method === 'POST') {
            const { username, password } = await request.json() as any;
            return handleRegister(username, password, env);
        }
        if (url.pathname === '/api/auth/login' && request.method === 'POST') {
            const { username, password } = await request.json() as any;
            return handleLogin(username, password, env);
        }
        if (url.pathname === '/api/auth/me') {
            const user = await verifyAuth(request, env);
            if (!user) return new Response('No autorizado', { status: 401 });
            return Response.json(user);
        }

        // --- ID extraction from query (Simpler for games) ---
        const userId = url.searchParams.get('userId') || 'guest';

        // 1. PUBLIC Endpoints (Passing supabase client to handlers)
        if (url.pathname === '/api/getBalance') return handleGetBalance(supabase, userId);
        if (url.pathname === '/api/roulette/spin' && request.method === 'POST') {
            const { amount, betType, betValue } = await request.json() as { amount: number, betType: string, betValue: string | number };
            return handleRouletteSpin(supabase, userId, amount, betType, betValue, env);
        }
        if (url.pathname === '/api/slots/spin' && request.method === 'POST') {
            const { amount } = await request.json() as { amount: number };
            return handleSlotSpin(supabase, userId, amount, env);
        }
        if (url.pathname === '/api/getXP') return handleGetXP(supabase, userId, env);
        if (url.pathname === '/api/placeBet' && request.method === 'POST') {
            const { amount } = await request.json() as { amount: number };
            return handlePlaceBet(supabase, userId, amount, env);
        }
        if (url.pathname === '/api/claimPrize' && request.method === 'POST') {
            const { amount, seed } = await request.json() as { amount: number, seed: string };
            const response = await handleClaimPrize(supabase, userId, amount, env);

            // Audit high-value wins (> $100) or suspicious patterns
            if (response.status === 200 && amount > 100) {
                await auditLogger(supabase, userId, amount, seed, request, env);
            }

            return response;
        }

        // 2. WALLET Endpoints
        const walletService = new WalletService(supabase, env);
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

            if (url.pathname === '/api/admin/stats') return handleGetStats(supabase, env);
            if (url.pathname === '/api/admin/update-odds' && request.method === 'POST') {
                const { rtp } = await request.json() as { rtp: number };
                return handleUpdateRTP(supabase, rtp, env);
            }
            if (url.pathname === '/api/admin/user-action' && request.method === 'POST') {
                const data = await request.json() as { targetUserId: string, action: string, value?: number };
                return handleUserAction(supabase, data, env);
            }
            // Roulette Admin
            if (url.pathname === '/api/admin/roulette/rtp' && request.method === 'POST') {
                const { rtp, bias } = await request.json() as { rtp: number, bias?: number };
                return handleUpdateRouletteRTP(supabase, rtp, bias, env);
            }
            if (url.pathname === '/api/admin/roulette/history') {
                return handleGetRouletteHistory(supabase, env);
            }
            if (url.pathname === '/api/admin/system/live') {
                return handleGetLiveCount(env);
            }
            if (url.pathname === '/api/admin/vault') return handleGetVaultStats(supabase, env);
            if (url.pathname === '/api/admin/users-list') {
                const page = parseInt(url.searchParams.get('page') || '1');
                return handleGetUsersList(supabase, page, env);
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

        // 4. BLACKJACK Endpoints
        const blackjackService = new BlackjackService(supabase);

        if (url.pathname === '/api/blackjack/start' && request.method === 'POST') {
            const { bet } = await request.json() as any;
            const state = await blackjackService.initGame(userId, bet);
            await blackjackService.saveGameState(userId, state);
            return Response.json({ success: true, state });
        }

        if (url.pathname === '/api/blackjack/hit' && request.method === 'POST') {
            let state = await blackjackService.getGameState(userId);
            if (!state) return new Response('No hay partida activa', { status: 400 });
            state = await blackjackService.hit(state);
            await blackjackService.saveGameState(userId, state);
            return Response.json({ success: true, state });
        }

        if (url.pathname === '/api/blackjack/stand' && request.method === 'POST') {
            let state = await blackjackService.getGameState(userId);
            if (!state) return new Response('No hay partida activa', { status: 400 });
            state = await blackjackService.stand(state);

            // Process winnings if game ended
            if (state.status !== 'playing') {
                let multiplier = 0;
                if (state.status === 'player_win') multiplier = 2;
                if (state.status === 'blackjack') multiplier = 2.5;
                if (state.status === 'push') multiplier = 1;

                const winAmount = state.bet * multiplier;

                // Sync with Supabase (profile balance)
                const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();
                await supabase.from('profiles').update({ balance: (profile?.balance || 0) + winAmount }).eq('id', userId);

                // XP System
                const xpService = new XPService(supabase);
                await xpService.addXP(userId, state.bet);

                await blackjackService.clearGameState(userId);
            } else {
                await blackjackService.saveGameState(userId, state);
            }
            return Response.json({ success: true, state });
        }

        // 5. MINES Endpoints
        const minesService = new MinesService(supabase);

        if (url.pathname === '/api/mines/start' && request.method === 'POST') {
            const { bet, mineCount } = await request.json() as any;
            if (bet <= 0) return new Response('Monto inválido', { status: 400 });
            if (mineCount < 1 || mineCount > 24) return new Response('Cantidad de minas inválida', { status: 400 });

            const { data: profile } = await supabase.from('profiles').select('balance, status').eq('id', userId).single();
            if (!profile || profile.status !== 'ACTIVE') return new Response('Usuario inactivo', { status: 403 });
            if (profile.balance < bet) return new Response('Fondos insuficientes', { status: 400 });

            // Deduct bet
            await supabase.from('profiles').update({ balance: profile.balance - bet }).eq('id', userId);

            const state = minesService.initGame(bet, mineCount);
            await minesService.saveGameState(userId, state);
            return Response.json({ success: true, state: { ...state, grid: null } }); // Don't send grid to client
        }

        if (url.pathname === '/api/mines/reveal' && request.method === 'POST') {
            const { index } = await request.json() as any;
            let state = await minesService.getGameState(userId);
            if (!state || state.status !== 'playing') return new Response('Sin partida activa', { status: 400 });

            state = minesService.reveal(state, index);

            if (state.status === 'loss') {
                await minesService.clearGameState(userId);
                // Record loss
                await supabase.from('bets').insert({
                    user_id: userId,
                    game_id: 'mines',
                    amount: state.bet,
                    payout: 0,
                    status: 'loss'
                });
            } else if (state.status === 'win') {
                // Auto cashout for win (all gems found)
                const winAmount = state.bet * state.multiplier;
                const { data: p } = await supabase.from('profiles').select('balance').eq('id', userId).single();
                await supabase.from('profiles').update({ balance: (p?.balance || 0) + winAmount }).eq('id', userId);
                await minesService.clearGameState(userId);
                await supabase.from('bets').insert({
                    user_id: userId,
                    game_id: 'mines',
                    amount: state.bet,
                    payout: winAmount,
                    status: 'win'
                });
            } else {
                await minesService.saveGameState(userId, state);
            }

            return Response.json({ success: true, state: { ...state, grid: state.status === 'playing' ? null : state.grid } });
        }

        if (url.pathname === '/api/mines/cashout' && request.method === 'POST') {
            const state = await minesService.getGameState(userId);
            if (!state || state.status !== 'playing' || state.revealed.length === 0) {
                return new Response('No se puede retirar', { status: 400 });
            }

            const winAmount = state.bet * state.multiplier;
            const { data: p } = await supabase.from('profiles').select('balance').eq('id', userId).single();
            await supabase.from('profiles').update({ balance: (p?.balance || 0) + winAmount }).eq('id', userId);

            await minesService.clearGameState(userId);
            await supabase.from('bets').insert({
                user_id: userId,
                game_id: 'mines',
                amount: state.bet,
                payout: winAmount,
                status: 'win'
            });

            // XP System
            const xpService = new XPService(supabase);
            await xpService.addXP(userId, state.bet);

            return Response.json({ success: true, winAmount, state: { ...state, status: 'win' } });
        }

        return new Response('No Encontrado', { status: 404 });
    }
};

const slotEngine = new SlotEngine();

async function auditLogger(supabase: SupabaseClient, userId: string, amount: number, seed: string, request: Request, env: Env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const id = crypto.randomUUID();

    await supabase.from('audit_logs').insert({
        id: id,
        user_id: userId,
        ip: ip,
        amount: amount,
        seed: seed,
        reason: 'Victoria de alto valor detectada'
    });

    // Pattern detection: 5 wins in last minute
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'prize')
        .gte('created_at', oneMinuteAgo);

    if (count && count >= 5) {
        await notifyFraud(userId, count, env);
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
 * JWT verification for all users
 */
async function verifyAuth(request: Request, env: Env): Promise<any | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];

    try {
        const [header, payload, signature] = token.split('.');
        if (!header || !payload || !signature) return null;

        const message = `${header}.${payload}`;
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw', encoder.encode(env.JWT_SECRET),
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['verify']
        );

        // Convert base64url to base64
        const sig = Uint8Array.from(atob(signature.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
        const isValid = await crypto.subtle.verify('HMAC', key, sig, encoder.encode(message));

        if (!isValid) return null;

        const data = JSON.parse(atob(payload));
        if (data.exp < Math.floor(Date.now() / 1000)) return null;

        return data; // { userId, username, role }
    } catch (e) {
        return null;
    }
}

/**
 * Admin verification using JWT session
 */
async function verifyAdmin(request: Request, env: Env): Promise<Response | null> {
    const user = await verifyAuth(request, env);

    // Legacy support for the custom key if used as a token directly (for backward compatibility during migration)
    const authHeader = request.headers.get('Authorization');
    if (authHeader === 'Bearer 29971627Nex@') return null;

    if (!user || user.role !== 'admin') {
        return new Response('Prohibido: Solo administradores', { status: 403 });
    }
    return null;
}

// AUTH HANDLERS
async function handleRegister(username: string, password: string, env: Env): Promise<Response> {
    return new Response('Autenticación migrada a Firebase. Por favor, regístrate en la interfaz.', { status: 410 });
}

async function handleLogin(username: string, password: string, env: Env): Promise<Response> {
    return new Response('Autenticación migrada a Firebase. Por favor, inicia sesión en la interfaz.', { status: 410 });
}

// CRYPTO HELPERS
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function signJWT(payload: any, secret: string): Promise<string> {
    const encoder = new TextEncoder();

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const extendedPayload = {
        ...payload,
        exp: Math.floor(Date.now() / 1000) + (86400 * 7), // 7 days
        iat: Math.floor(Date.now() / 1000)
    };

    const encodedPayload = btoa(JSON.stringify(extendedPayload))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const message = `${header}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        'raw', encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false, ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    return `${message}.${encodedSignature}`;
}

async function handleRouletteSpin(supabase: SupabaseClient, userId: string, betAmount: number, betType: string, betValue: string | number, env: Env): Promise<Response> {
    if (betAmount <= 0) return new Response('Monto de apuesta inválido', { status: 400 });

    const engine = new RouletteEngine();

    // 1. Debit User (Atomic-ish with upsert or conditional update)
    // In Supabase we use RPC for atomic balance changes or just a transaction-like update
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance, status, xp, level')
        .eq('id', userId)
        .single();

    if (profileError || !profile) return new Response('Usuario no encontrado', { status: 404 });
    if (profile.status !== 'ACTIVE') return new Response('Cuenta inactiva', { status: 403 });
    if (profile.balance < betAmount) return new Response('Fondos insuficientes', { status: 400 });

    // 2. Generate Result
    const result = engine.spin(betType, betValue, betAmount);

    // 3. Update Balance (Deduct bet, add win)
    const newBalance = profile.balance - betAmount + result.payout;
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            balance: newBalance,
            updated_at: new Date().toISOString()
        })
        .eq('id', userId);

    if (updateError) return new Response('Error al actualizar el saldo', { status: 500 });

    // 4. Record Bet
    const txId = crypto.randomUUID();
    await supabase.from('bets').insert({
        id: txId,
        user_id: userId,
        game_id: 'roulette',
        amount: betAmount,
        payout: result.payout,
        status: result.win ? 'win' : 'loss'
    });

    // 5. XP System (Simplified for now - can be moved to RPC)
    const newXP = (profile.xp || 0) + Math.floor(betAmount * 10);
    const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;
    await supabase.from('profiles').update({ xp: newXP, level: newLevel }).eq('id', userId);

    return Response.json({
        ...result,
        txId,
        newBalance,
        xpInfo: {
            xp: newXP,
            level: newLevel
        }
    });
}

async function handleSlotSpin(supabase: SupabaseClient, userId: string, betAmount: number, env: Env): Promise<Response> {
    if (betAmount <= 0) return new Response('Apuesta inválida', { status: 400 });

    // 1. Get Global RTP from Supabase
    const { data: rtpSetting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'global_rtp')
        .single();
    const rtp = rtpSetting ? parseFloat(rtpSetting.value) : 0.95;

    // 2. Debit User
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('balance, status, xp, level')
        .eq('id', userId)
        .single();

    if (userError || !user) return new Response('Usuario no encontrado', { status: 404 });
    if (user.status !== 'ACTIVE') return new Response('Cuenta inactiva', { status: 403 });
    if (user.balance < betAmount) return new Response('Fondos insuficientes', { status: 400 });

    // 3. Generate Result
    const result = slotEngine.spin(rtp);
    const winAmount = betAmount * result.payoutMultiplier;

    // 4. Update Balance
    const newBalance = user.balance - betAmount + winAmount;
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);

    // 5. Record Bet
    const txId = crypto.randomUUID();
    await supabase.from('bets').insert({
        id: txId,
        user_id: userId,
        game_id: 'slots_neon',
        amount: betAmount,
        payout: winAmount,
        status: result.win ? 'win' : 'loss'
    });

    // 6. XP System
    const xpService = new XPService(supabase);
    const xpResult = await xpService.addXP(userId, betAmount);

    return Response.json({
        ...result,
        txId,
        winAmount,
        newBalance,
        xpInfo: {
            xp: xpResult?.newXP,
            level: xpResult?.newLevel,
            rank: xpResult?.rank
        }
    });
}

// ADMIN HANDLERS
async function handleGetStats(supabase: SupabaseClient, env: Env): Promise<Response> {
    const { data: stats, error } = await supabase
        .from('bets')
        .select('amount, payout')
        .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    if (error) return new Response('Error al obtener estadísticas', { status: 500 });

    const totalBet = stats.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const totalPaid = stats.reduce((acc, curr) => acc + (curr.payout || 0), 0);
    const ggr = totalBet - totalPaid;

    return Response.json({
        success: true,
        stats: { total_bet: totalBet, total_paid: totalPaid, ggr }
    });
}

async function handleUpdateRTP(supabase: SupabaseClient, rtp: number, env: Env): Promise<Response> {
    if (rtp < 0 || rtp > 1) return new Response('El RTP debe estar entre 0 y 1', { status: 400 });
    await supabase.from('settings').upsert({ key: 'global_rtp', value: rtp.toString(), updated_at: new Date().toISOString() }, { onConflict: 'key' });
    return Response.json({ success: true, new_rtp: rtp });
}

async function handleUserAction(supabase: SupabaseClient, data: any, env: Env): Promise<Response> {
    const { targetUserId, action, value } = data;
    if (action === 'ban') {
        await supabase.from('profiles').update({ status: 'BANNED' }).eq('id', targetUserId);
    } else if (action === 'adjust' && value !== undefined) {
        // Fetch current and update
        const { data: profile } = await supabase.from('profiles').select('balance').eq('id', targetUserId).single();
        await supabase.from('profiles').update({ balance: (profile?.balance || 0) + value }).eq('id', targetUserId);
    } else {
        return new Response('Acción inválida', { status: 400 });
    }
    return Response.json({ success: true, action, targetUserId });
}

async function handleUpdateRouletteRTP(supabase: SupabaseClient, rtp: number, bias: number = 0, env: Env): Promise<Response> {
    // Validar RTP (0.0 - 1.0)
    if (rtp < 0 || rtp > 1) return new Response('RTP inválido', { status: 400 });

    await supabase.from('settings').upsert({
        key: 'roulette_rtp_bias',
        value: rtp.toString(),
        updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    return Response.json({ success: true, rtp });
}

async function handleGetRouletteHistory(supabase: SupabaseClient, env: Env): Promise<Response> {
    const { data: history, error } = await supabase
        .from('bets')
        .select('id, game_id, amount, payout, status, created_at')
        .eq('game_id', 'roulette')
        .order('created_at', { ascending: false })
        .limit(50);

    if (error) return new Response('Error al obtener historial', { status: 500 });
    return Response.json({ success: true, history });
}

async function handleGetLiveCount(env: Env): Promise<Response> {
    const id = env.PRESENCE.idFromName('global_counter');
    const obj = env.PRESENCE.get(id);
    const resp = await obj.fetch('http://do/count'); // Internal DO fetch
    return resp;
}

async function handleGetVaultStats(supabase: SupabaseClient, env: Env): Promise<Response> {
    // 1. Get total player balances
    const { data: playerStats } = await supabase
        .from('profiles')
        .select('balance');

    const playerDebts = playerStats?.reduce((acc, curr) => acc + (curr.balance || 0), 0) || 0;

    // 2. Get total net transactions (deposits/withdrawals/bets/prizes)
    const { data: txStats } = await supabase
        .from('transactions')
        .select('amount, type');

    const totalWallet = txStats?.reduce((acc, curr) => {
        if (curr.type === 'deposit' || curr.type === 'bet') return acc + (curr.amount || 0);
        if (curr.type === 'withdrawal' || curr.type === 'prize') return acc - (curr.amount || 0);
        return acc;
    }, 0) || 0;

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

async function handleGetUsersList(supabase: SupabaseClient, page: number, env: Env): Promise<Response> {
    const limit = 10;
    const offset = (page - 1) * limit;

    const { data: users, error } = await supabase
        .from('profiles')
        .select(`
            id, balance, status, xp, level
        `)
        .order('balance', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) return new Response('Error al obtener usuarios', { status: 500 });

    return Response.json({ success: true, users, page });
}

async function handleGetXP(supabase: SupabaseClient, userId: string, env: Env): Promise<Response> {
    const { data: user, error } = await supabase
        .from('profiles')
        .select('xp, level')
        .eq('id', userId)
        .single();

    if (error || !user) return new Response('Usuario no encontrado', { status: 404 });

    // Mock rank for now
    const rank = user.level > 50 ? 'G-God' : (user.level > 20 ? 'Elite' : 'Rookie');

    return Response.json({
        userId,
        xp: user.xp,
        level: user.level,
        rank
    });
}

// USER HANDLERS (Previous logic)
async function handleGetBalance(supabase: SupabaseClient, userId: string): Promise<Response> {
    const { data: user, error } = await supabase
        .from('profiles')
        .select('balance, status')
        .eq('id', userId)
        .single();

    if (error || !user) return new Response('Usuario no encontrado', { status: 404 });
    if (user.status === 'BANNED') return new Response('Cuenta bloqueada', { status: 403 });

    return Response.json({ userId, balance: user.balance });
}

async function handlePlaceBet(supabase: SupabaseClient, userId: string, amount: number, env: Env): Promise<Response> {
    if (amount <= 0) return new Response('Monto inválido', { status: 400 });

    try {
        const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('balance, status')
            .eq('id', userId)
            .single();

        if (userError || !user) return new Response('Usuario no encontrado', { status: 404 });
        if (user.status !== 'ACTIVE') return new Response('Usuario inactivo', { status: 403 });
        if (user.balance < amount) return new Response('Fondos insuficientes', { status: 400 });

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: user.balance - amount })
            .eq('id', userId);

        if (updateError) return new Response('Error al actualizar el saldo', { status: 500 });

        await supabase.from('transactions').insert({
            id: crypto.randomUUID(),
            user_id: userId,
            type: 'bet',
            amount: amount,
            created_at: new Date().toISOString()
        });

        // XP System Integration
        const xpService = new XPService(supabase);
        await xpService.addXP(userId, amount);

        return Response.json({ success: true, betAmount: amount });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
}

async function handleClaimPrize(supabase: SupabaseClient, userId: string, amount: number, env: Env): Promise<Response> {
    if (amount <= 0) return new Response('Monto inválido', { status: 400 });

    try {
        const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('balance, status')
            .eq('id', userId)
            .single();

        if (userError || !user) return new Response('Usuario no encontrado', { status: 404 });
        if (user.status !== 'ACTIVE') return new Response('Usuario inactivo', { status: 403 });

        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: (user.balance || 0) + amount })
            .eq('id', userId);

        if (updateError) return new Response('Error al actualizar el saldo', { status: 500 });

        await supabase.from('transactions').insert({
            id: crypto.randomUUID(),
            user_id: userId,
            type: 'prize',
            amount: amount,
            created_at: new Date().toISOString()
        });

        return Response.json({ success: true, prizeAmount: amount });
    } catch (e: any) {
        return new Response(e.message, { status: 500 });
    }
}
