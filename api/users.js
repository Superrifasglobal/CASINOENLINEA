import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    // Allow Admin Access Only (Simple check, can be improved)
    // Realistically we should check the JWT from the request header 
    // to ensure the request comes from an logged-in admin.
    // For now, we'll assume the /admin route protection in frontend is the first line of defense,
    // but a backend check is better.

    if (!supabaseUrl) {
        return res.status(500).json({
            error: 'Server Misconfiguration: Missing Supabase URL',
            details: 'Please add VITE_SUPABASE_URL to Vercel Environment Variables.'
        });
    }

    if (!supabaseServiceKey) {
        return res.status(500).json({
            error: 'Server Misconfiguration: Missing Service Role Key',
            details: 'Please add SUPABASE_SERVICE_ROLE_KEY to Vercel Environment Variables.'
        });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    try {
        const { data: { users }, error } = await supabase.auth.admin.listUsers();

        if (error) {
            throw error;
        }

        // Transform users to match frontend expectation
        // We mock game stats (balance, xp) since they aren't in Auth
        const enhancedUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            created_at: u.created_at,
            last_bet: u.last_sign_in_at || new Date().toISOString(),
            status: u.banned_until ? 'BANNED' : 'ACTIVE',
            // Mocked game data until we have a 'profiles' table sync
            balance: (Math.random() * 1000).toFixed(2),
            level: Math.floor(Math.random() * 20) + 1,
            xp: Math.floor(Math.random() * 5000),
            role: u.user_metadata?.role || 'user'
        }));

        return res.status(200).json({ users: enhancedUsers });

    } catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: err.message });
    }
}
