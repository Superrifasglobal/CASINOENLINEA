-- 1. Create deposits table if not exists (to store user reports)
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(20, 2) NOT NULL CHECK (amount > 0),
    method TEXT NOT NULL,
    reference TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create RPC function for Atomic Balance Increment
-- This ensures that multiple simultaneous updates don't cause race conditions
CREATE OR REPLACE FUNCTION public.increment_balance(user_uuid UUID, amount_to_add NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE public.profiles
    SET balance = balance + amount_to_add,
        updated_at = now()
    WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable RLS on deposits
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for deposits
-- Users can insert their own deposits and view them
DROP POLICY IF EXISTS "Users can insert own deposits" ON public.deposits;
CREATE POLICY "Users can insert own deposits" ON public.deposits 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own deposits" ON public.deposits;
CREATE POLICY "Users can view own deposits" ON public.deposits 
    FOR SELECT USING (auth.uid() = user_id);

-- Admin can see all (Optional: depends on if you use service role or client)
-- Since we use Service Role in API, we don't strictly need extra policies for Admin here, 
-- but it's good practice if you ever use the client directly.
