-- Add Mines games table
CREATE TABLE IF NOT EXISTS public.mines_games (
    user_id TEXT PRIMARY KEY,
    state JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.mines_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public mines access" ON public.mines_games FOR ALL USING (true);
