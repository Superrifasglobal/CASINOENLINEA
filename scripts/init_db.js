import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function init() {
    console.log('--- Initializing Payment Gateways ---');

    const gateways = [
        {
            id: 'binance_pay',
            type: 'binance',
            is_active: true,
            config: {
                address: '0x1234567890123456789012345678901234567890', // Default placeholder
            }
        },
        {
            id: 'pago_movil',
            type: 'fiat',
            is_active: true,
            config: {
                phone: '04120000000',
                bank: 'Banesco',
                ci: '12345678'
            }
        }
    ];

    for (const gateway of gateways) {
        const { error } = await supabase
            .from('payment_gateways')
            .upsert(gateway, { onConflict: 'id' });

        if (error) {
            console.error(`Error initializing ${gateway.id}:`, error.message);
            console.log('Checking if table exists...');
        } else {
            console.log(`Successfully initialized ${gateway.id}`);
        }
    }

    console.log('--- Done ---');
}

init();
