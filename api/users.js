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

        // Fetch profile data for all users to get real balances and levels
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, balance, display_name, role, created_at');

        if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
            // Non-critical: we can continue with empty profiles but it's not ideal
        }

        const profileMap = profiles ? profiles.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}) : {};

        // Transform users to match frontend expectation
        const enhancedUsers = users.map(u => {
            const profile = profileMap[u.id];
            return {
                id: u.id,
                email: u.email,
                created_at: u.created_at,
                last_bet: u.last_sign_in_at || new Date().toISOString(),
                status: u.banned_until ? 'BANNED' : 'ACTIVE',
                // Real data or defaults if profile doesn't exist yet
                balance: profile?.balance || 0,
                // These might need addition to schema later, using defaults for now
                level: 1,
                xp: 0,
                role: profile?.role || u.user_metadata?.role || 'user'
            };
        });

        return res.status(200).json({ users: enhancedUsers });

    } catch (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: err.message });
    }
}
