import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const TARGET_RTP = 0.95;

const calculatePotentialPayout = (winNum, bets) => {
    let payout = 0;
    const winNumStr = winNum.toString();
    Object.entries(bets).forEach(([betId, amount]) => {
        if (betId === winNumStr) payout += amount * 36;
        else if (betId === 'dozen_1' && winNum >= 1 && winNum <= 12) payout += amount * 3;
        else if (betId === 'dozen_2' && winNum >= 13 && winNum <= 24) payout += amount * 3;
        else if (betId === 'dozen_3' && winNum >= 25 && winNum <= 36) payout += amount * 3;
        else if (betId === 'column_1' && winNum % 3 === 1) payout += amount * 3;
        else if (betId === 'column_2' && winNum % 3 === 2) payout += amount * 3;
        else if (betId === 'column_3' && winNum % 3 === 0 && winNum !== 0) payout += amount * 3;
        else if (betId === 'even' && winNum !== 0 && winNum % 2 === 0) payout += amount * 2;
        else if (betId === 'odd' && winNum !== 0 && winNum % 2 !== 0) payout += amount * 2;
        else if (betId === 'red' && RED_NUMBERS.includes(winNum)) payout += amount * 2;
        else if (betId === 'black' && winNum !== 0 && !RED_NUMBERS.includes(winNum)) payout += amount * 2;
        else if (betId === 'low' && winNum >= 1 && winNum <= 18) payout += amount * 2;
        else if (betId === 'high' && winNum >= 19 && winNum <= 36) payout += amount * 2;
    });
    return payout;
};

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId, bets, totalBet } = req.body;

    try {
        // 1. Fetch User and Global Stats
        const { data: profile, error: profileErr } = await supabase.from('profiles').select('balance').eq('id', userId).single();
        if (profileErr || profile.balance < totalBet) return res.status(400).json({ error: 'Insufficient balance' });

        const { data: stats } = await supabase.from('casino_stats').select('*').eq('id', 'global').single();
        const currentRTP = stats ? (stats.total_payouts / stats.total_bets) : 0.9;

        // 2. RTP Control Engine
        let winningNumber;
        if (currentRTP > TARGET_RTP) {
            // "Low Loss" mode: Filter numbers by payout and pick one from the lowest candidates
            const options = ROULETTE_SEQUENCE.map(num => ({
                num,
                payout: calculatePotentialPayout(num, bets)
            })).sort((a, b) => a.payout - b.payout);

            // Pick among the 5 best numbers for the house
            winningNumber = options[Math.floor(Math.random() * 5)].num;
        } else {
            // "Fair" mode: Random selection
            winningNumber = ROULETTE_SEQUENCE[Math.floor(Math.random() * 37)];
        }

        const payout = calculatePotentialPayout(winningNumber, bets);

        // 3. Atomic Transaction (Simplified for Demo - ideally use RPC)
        const { data: gameSession } = await supabase.rpc('process_roulette_bet', {
            p_user_id: userId,
            p_bet_amount: totalBet,
            p_win_amount: payout,
            p_win_number: winningNumber,
            p_bets_json: bets
        });

        res.status(200).json({
            "session_id": gameSession?.id || (Math.random().toString(36).substring(2) + Date.now().toString(36)),
            "user_balance": profile.balance - totalBet + payout,
            "current_bet": bets,
            "server_result": winningNumber,
            "visual_seed": Math.floor(Math.random() * 100000),
            "rtp_status": currentRTP > TARGET_RTP ? "optimized" : "fair"
        });

    } catch (error) {
        console.error('Spin API Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
