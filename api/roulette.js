import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with service role for admin rights (server-side only)
const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Should be added to Vercel envs
);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { betAmount, betType, betValue, userId } = req.body;

    if (!userId || !betAmount || betAmount <= 0) {
        return res.status(400).json({ error: 'Invalid request parameters' });
    }

    try {
        // 1. Get user profile and check balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('balance')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            return res.status(404).json({ error: 'User profile not found' });
        }

        if (profile.balance < betAmount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        // 2. Spin the wheel
        const winningNumber = Math.floor(Math.random() * 37);
        const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

        let isWin = false;
        let payoutMultiplier = 0;

        if (betType === 'number') {
            if (parseInt(betValue) === winningNumber) {
                isWin = true;
                payoutMultiplier = 36;
            }
        } else if (betType === 'color') {
            const isWinningRed = redNumbers.includes(winningNumber);
            const winningColor = winningNumber === 0 ? 'green' : (isWinningRed ? 'red' : 'black');
            if (betValue === winningColor) {
                isWin = true;
                payoutMultiplier = 2;
            }
        }

        const winAmount = isWin ? betAmount * payoutMultiplier : 0;
        const netChange = winAmount - betAmount;

        // 3. Atomic transaction (Supabase RPC would be better, but we'll use sequential ops for now)
        // Update balance
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ balance: profile.balance + netChange })
            .eq('id', userId);

        if (updateError) throw updateError;

        // Record bet
        const { error: betError } = await supabase
            .from('bets')
            .insert({
                user_id: userId,
                amount: betAmount,
                payout: winAmount,
                is_win: isWin,
                game_type: 'roulette',
                game_data: { winningNumber, betType, betValue }
            });

        if (betError) throw betError;

        return res.status(200).json({
            success: true,
            winningNumber,
            isWin,
            winAmount,
            newBalance: profile.balance + netChange
        });

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
