import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kdpqphobrbfhzvvfdiqq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_XV35nY6SDWkugY60EIJysg_y-N70kFx';

const isConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

export const supabase = isConfigured
    ? createClient(supabaseUrl, supabaseAnonKey)
    : {
        auth: {
            getSession: async () => ({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } }, error: null }),
            signInWithPassword: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
            signUp: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
            signOut: async () => ({ error: null }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: new Error('Supabase not configured') }),
                    order: () => ({ limit: async () => ({ data: [], error: null }) })
                }),
                single: async () => ({ data: null, error: new Error('Supabase not configured') })
            }),
            insert: async () => ({ data: null, error: new Error('Supabase not configured') }),
            update: () => ({ eq: async () => ({ data: null, error: new Error('Supabase not configured') }) }),
        })
    };

if (!isConfigured) {
    console.warn('Supabase credentials missing. Mock client initialized to prevent crashes.');
}
