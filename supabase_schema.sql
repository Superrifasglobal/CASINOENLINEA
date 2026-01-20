-- SUPABASE SCHEMA FOR NEXBET
-- Execute this in the Supabase SQL Editor

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE transaction_type AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'BET', 'WIN', 'REFUND', 'BONUS');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- 2. Create Profiles table (Public Schema)
-- This table extends the auth.users table provided by Supabase
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  balance NUMERIC(20, 2) DEFAULT 0.0 CHECK (balance >= 0),
  role user_role DEFAULT 'USER',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Transactions table
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC(20, 2) NOT NULL,
  type transaction_type NOT NULL,
  status transaction_status DEFAULT 'PENDING',
  currency TEXT DEFAULT 'USD',
  metadata JSONB,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create Bets table
CREATE TABLE public.bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount NUMERIC(20, 2) NOT NULL,
  payout NUMERIC(20, 2) DEFAULT 0,
  multiplier NUMERIC(10, 4),
  is_win BOOLEAN DEFAULT false,
  game_type TEXT NOT NULL, -- e.g., 'roulette', 'slots', 'blackjack'
  game_data JSONB,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bets ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies

-- Profiles: Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Transactions: Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Bets: Users can view their own bets
CREATE POLICY "Users can view own bets" ON public.bets
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Trigger to automatically create a profile when a new user signs up
-- This is critical for Supabase Auth integration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_transaction_updated
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
