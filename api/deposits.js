import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (!supabaseUrl || !supabaseServiceKey) {
        return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
        try {
            // Fetch deposits joining with profile to get email/display_name
            const { data, error } = await supabase
                .from('deposits')
                .select(`
                    *,
                    profiles:user_id (email, display_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.status(200).json({ deposits: data });
        } catch (err) {
            return res.status(500).json({ error: err.message });
        }
    }

    if (req.method === 'POST') {
        const { depositId, action } = req.body; // action: 'approve' or 'reject'

        if (!depositId || !action) {
            return res.status(400).json({ error: 'Missing depositId or action' });
        }

        try {
            // 1. Get deposit details
            const { data: deposit, error: fetchError } = await supabase
                .from('deposits')
                .select('*')
                .eq('id', depositId)
                .single();

            if (fetchError || !deposit) throw new Error('Deposit not found');
            if (deposit.status !== 'pending') throw new Error('Deposit already processed');

            if (action === 'approve') {
                // 2. Perform Atomic Balance Update and Status change
                // We use a transaction-like approach or just sequential calls with service key

                // Update profile balance
                const { error: balanceError } = await supabase.rpc('increment_balance', {
                    user_uuid: deposit.user_id,
                    amount_to_add: deposit.amount
                });

                // If RPC fails (maybe not defined), fallback to sequential for now 
                // (though RPC is safer for concurrency)
                if (balanceError) {
                    console.warn('RPC increment_balance failed, falling back to sequential update');
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('balance')
                        .eq('id', deposit.user_id)
                        .single();

                    const newBalance = (profile?.balance || 0) + deposit.amount;

                    await supabase
                        .from('profiles')
                        .update({ balance: newBalance })
                        .eq('id', deposit.user_id);
                }

                // Update deposit status
                await supabase
                    .from('deposits')
                    .update({ status: 'completed' })
                    .eq('id', depositId);

                // Create a record in transactions table too
                await supabase.from('transactions').insert({
                    user_id: deposit.user_id,
                    amount: deposit.amount,
                    type: 'DEPOSIT',
                    status: 'COMPLETED',
                    metadata: { deposit_id: deposit.id, reference: deposit.reference }
                });

            } else if (action === 'reject') {
                await supabase
                    .from('deposits')
                    .update({ status: 'failed' })
                    .eq('id', depositId);
            }

            return res.status(200).json({ success: true });

        } catch (err) {
            console.error('Action error:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
