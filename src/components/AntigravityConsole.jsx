import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
    Settings,
    Zap,
    TrendingUp,
    ShieldAlert,
    Activity,
    Save,
    RefreshCw,
    Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

const AntigravityConsole = () => {
    const [config, setConfig] = useState({
        global_rtp: 95,
        roulette_house_margin: 100
    });
    const [stats, setStats] = useState({
        total_bets: 0,
        total_payouts: 0,
        current_rtp: 0
    });
    const [isSaving, setIsSaving] = useState(false);
    const [lastSync, setLastSync] = useState(new Date().toLocaleTimeString());

    useEffect(() => {
        fetchConfig();
        fetchStats();

        // Realtime Subscription
        const channel = supabase
            .channel('casino_updates')
            .on('postgres_changes', { event: '*', table: 'casino_stats' }, fetchStats)
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    const fetchConfig = async () => {
        const { data } = await supabase.from('casino_config').select('*').eq('id', 'global').single();
        if (data) {
            setConfig({
                global_rtp: data.global_rtp * 100,
                roulette_house_margin: data.roulette_house_margin * 100
            });
        }
    };

    const fetchStats = async () => {
        const { data } = await supabase.from('casino_stats').select('*').eq('id', 'global').single();
        if (data) {
            setStats({
                total_bets: data.total_bets,
                total_payouts: data.total_payouts,
                current_rtp: (data.total_payouts / data.total_bets * 100) || 0
            });
            setLastSync(new Date().toLocaleTimeString());
        }
    };

    const handleUpdate = async () => {
        setIsSaving(true);
        const { error } = await supabase.from('casino_config').upsert({
            id: 'global',
            global_rtp: config.global_rtp / 100,
            roulette_house_margin: config.roulette_house_margin / 100,
            updated_at: new Date().toISOString()
        });

        if (!error) {
            setTimeout(() => setIsSaving(false), 800);
        } else {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] p-8 font-mono text-white selection:bg-neon-cyan">
            {/* Header */}
            <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-neon-cyan/20 rounded-xl flex items-center justify-center border border-neon-cyan/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]">
                        <Cpu className="text-neon-cyan" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic">Antigravity Console</h1>
                        <p className="text-gray-500 text-xs tracking-widest uppercase">Protocolo de Control Maestro v4.2.0</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end text-neon-green mb-1">
                        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">En Línea</span>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Sincronicización: {lastSync}</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Control Modules */}
                <div className="space-y-8">
                    {/* Global RTP Control */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-cyan/5 blur-3xl rounded-full" />

                        <div className="flex items-center gap-3 mb-8">
                            <Zap className="text-neon-cyan" />
                            <h2 className="text-xl font-bold uppercase italic tracking-wider">Gestor de RTP Global</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Retorno al Jugador (RTP)</label>
                                <span className="text-4xl font-black text-neon-cyan italic leading-none">{config.global_rtp}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={config.global_rtp}
                                onChange={(e) => setConfig({ ...config, global_rtp: parseInt(e.target.value) })}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 uppercase font-bold tracking-widest">
                                <span>Beneficio Máximo (0%)</span>
                                <span>Equilibrado (95%)</span>
                                <span>Alto Riesgo (100%)</span>
                            </div>
                        </div>
                    </div>

                    {/* Roulette Bias Control */}
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 blur-3xl rounded-full" />

                        <div className="flex items-center gap-3 mb-8">
                            <Activity className="text-neon-green" />
                            <h2 className="text-xl font-bold uppercase italic tracking-wider">Sesgo de Ruleta (Neon Roulette)</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Margen de la Casa</label>
                                <span className="text-4xl font-black text-neon-green italic leading-none">{config.roulette_house_margin}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={config.roulette_house_margin}
                                onChange={(e) => setConfig({ ...config, roulette_house_margin: parseInt(e.target.value) })}
                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-green"
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 uppercase font-bold tracking-widest">
                                <span className="text-neon-green">Agresivo (0%)</span>
                                <span>Estándar (100%)</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleUpdate}
                        disabled={isSaving}
                        className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xl uppercase italic tracking-tighter flex items-center justify-center gap-3 hover:bg-neon-cyan hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="animate-spin" /> : <Save />}
                        {isSaving ? 'Actualizando Protocolos...' : 'Guardar Cambios Maestros'}
                    </button>
                </div>

                {/* Real-time Stats */}
                <div className="space-y-8">
                    <div className="glass-panel p-8 rounded-3xl border border-white/10 h-full">
                        <div className="flex items-center gap-3 mb-10">
                            <TrendingUp className="text-neon-cyan" />
                            <h2 className="text-xl font-bold uppercase italic tracking-wider">Métricas en Tiempo Real</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Total Apostado (Global)</p>
                                <p className="text-3xl font-black italic tracking-tighter">$ {stats.total_bets.toLocaleString()}</p>
                            </div>

                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Total Pagado (Global)</p>
                                <p className="text-3xl font-black italic tracking-tighter text-neon-cyan">$ {stats.total_payouts.toLocaleString()}</p>
                            </div>

                            <div className="p-6 bg-white/5 rounded-2xl border border-white/5 relative">
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">RTP Real del Casino</p>
                                <div className="flex items-end gap-2">
                                    <p className={`text-5xl font-black italic tracking-tighter ${stats.current_rtp > 97 ? 'text-red-500' : 'text-neon-green'}`}>
                                        {stats.current_rtp.toFixed(2)}%
                                    </p>
                                    <span className="text-[10px] text-gray-600 uppercase font-bold mb-2 tracking-widest">vs Objetivo ({config.global_rtp}%)</span>
                                </div>
                                <div className="mt-6 w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stats.current_rtp}%` }}
                                        className={`h-full ${stats.current_rtp > config.global_rtp ? 'bg-red-500 shadow-[0_0_15px_#ef4444]' : 'bg-neon-green shadow-[0_0_15px_#39ff14]'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4 items-start">
                            <ShieldAlert className="text-red-500 shrink-0" />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Estado Crítico</p>
                                <p className="text-[10px] text-gray-400 leading-relaxed uppercase">
                                    Si el RTP real supera el objetivo por más del 2%, el bias algorítmico se activará automáticamente en todos los juegos de mesa.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AntigravityConsole;
