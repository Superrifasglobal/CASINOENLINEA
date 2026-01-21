-- UPDATED SCHEMA FOR HYBRID FIREBASE-SUPABASE
-- Change ID to TEXT to support Firebase UIDs

-- 1. Drop existing triggers if necessary
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Modify Profiles table
ALTER TABLE public.profiles ALTER COLUMN id TYPE TEXT;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. Modify Transactions and Bets
ALTER TABLE public.transactions ALTER COLUMN user_id TYPE TEXT;
ALTER TABLE public.bets ALTER COLUMN user_id TYPE TEXT;

-- 3.1 Add Blackjack games table
CREATE TABLE IF NOT EXISTS public.blackjack_games (
    user_id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add missing columns for gaming logic
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Update RLS (Allow public CRUD for now or filter by 'id' safely)
-- NOTE: In a production app, you would verify the Firebase JWT in a backend proxy.
-- For local/perfect prototype feel, we use public access with column filters.

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Public profile access" ON public.profiles
  FOR ALL USING (true); -- Allow all for sync

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Public transactions access" ON public.transactions
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view own bets" ON public.bets;
CREATE POLICY "Public bets access" ON public.bets
  FOR ALL USING (true);
