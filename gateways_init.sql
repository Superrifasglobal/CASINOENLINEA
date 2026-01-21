-- Create Payment Gateways table if not exists
CREATE TABLE IF NOT EXISTS public.payment_gateways (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT false,
    config JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Initialize/Update Binance Pay record
INSERT INTO public.payment_gateways (id, name, is_active, config)
VALUES (
    'binance_pay', 
    'Binance Pay', 
    true, 
    '{"address": "0xYourWalletAddressHere_BEP20"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
    is_active = EXCLUDED.is_active,
    config = EXCLUDED.config;

-- Initialize/Update Pago Móvil record
INSERT INTO public.payment_gateways (id, name, is_active, config)
VALUES (
    'pago_movil', 
    'Pago Móvil', 
    true, 
    '{"phone": "04121234567", "bank": "0102 - BANCO DE VENEZUELA", "ci": "V-12345678"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET 
    is_active = EXCLUDED.is_active,
    config = EXCLUDED.config;

-- Enable RLS
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view payment_gateways" ON public.payment_gateways;
CREATE POLICY "Public view payment_gateways" ON public.payment_gateways FOR SELECT USING (true);
