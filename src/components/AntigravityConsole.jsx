import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Settings,
    Zap,
    TrendingUp,
    ShieldAlert,
    Activity,
    Save,
    RefreshCw,
    Cpu,
    CreditCard,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const [activeTab, setActiveTab] = useState('config'); // 'config', 'payments', 'deposits'
    const [gateways, setGateways] = useState({
        binance: { address: '', is_active: true },
        pago_movil: { phone: '', bank: '', ci: '', is_active: true }
    });
    const [pendingDeposits, setPendingDeposits] = useState([]);

    useEffect(() => {
        fetchConfig();
        fetchStats();
        fetchGateways();
        fetchPendingDeposits();

        // Realtime Subscriptions
        const statsChannel = supabase
            .channel('stats_updates')
            .on('postgres_changes', { event: '*', table: 'casino_stats' }, fetchStats)
            .subscribe();

        const configChannel = supabase
            .channel('config_updates')
            .on('postgres_changes', { event: 'UPDATE', table: 'casino_config' }, fetchConfig)
            .subscribe();

        const depositChannel = supabase
            .channel('deposit_updates')
            .on('postgres_changes', { event: 'INSERT', table: 'deposits' }, fetchPendingDeposits)
            .subscribe();

        return () => {
            supabase.removeChannel(statsChannel);
            supabase.removeChannel(configChannel);
            supabase.removeChannel(depositChannel);
        };
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

    const fetchGateways = async () => {
        const { data } = await supabase.from('payment_gateways').select('*');
        if (data) {
            const binance = data.find(g => g.id === 'binance_pay');
            const pm = data.find(g => g.id === 'pago_movil');
            setGateways({
                binance: binance?.config || { address: '', is_active: false },
                pago_movil: pm?.config || { phone: '', bank: '', ci: '', is_active: false }
            });
        }
    };

    const fetchPendingDeposits = async () => {
        const { data } = await supabase.from('deposits').select('*').eq('status', 'pending').order('created_at', { ascending: false });
        if (data) setPendingDeposits(data);
    };

    const handleUpdateConfig = async () => {
        setIsSaving(true);
        const { error } = await supabase.from('casino_config').upsert({
            id: 'global',
            global_rtp: config.global_rtp / 100,
            roulette_house_margin: config.roulette_house_margin / 100,
            updated_at: new Date().toISOString()
        });
        if (!error) setTimeout(() => setIsSaving(false), 800);
        else setIsSaving(false);
    };

    const handleUpdateGateways = async () => {
        setIsSaving(true);
        await Promise.all([
            supabase.from('payment_gateways').upsert({ id: 'binance_pay', type: 'binance', config: gateways.binance, is_active: gateways.binance.is_active }),
            supabase.from('payment_gateways').upsert({ id: 'pago_movil', type: 'fiat', config: gateways.pago_movil, is_active: gateways.pago_movil.is_active })
        ]);
        setTimeout(() => setIsSaving(false), 800);
    };

    const approveDeposit = async (depId) => {
        // Logic to approve deposit and credit user balance
        // This should hit a specialized RPC or endpoint for safety
        await supabase.rpc('approve_deposit', { p_deposit_id: depId });
        fetchPendingDeposits();
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

                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button onClick={() => setActiveTab('config')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'config' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Config. Motor</button>
                    <button onClick={() => setActiveTab('payments')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all ${activeTab === 'payments' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>Pasarelas</button>
                    <button onClick={() => setActiveTab('deposits')} className={`px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'deposits' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}>
                        Depósitos <span className={`px-1.5 py-0.5 rounded ${pendingDeposits.length > 0 ? 'bg-neon-pink text-white animate-pulse' : 'bg-white/10 text-gray-400'}`}>{pendingDeposits.length}</span>
                    </button>
                </div>

                <div className="text-right">
                    <div className="flex items-center gap-2 justify-end text-neon-green mb-1">
                        <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest">Sincronizado</span>
                    </div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{lastSync}</p>
                </div>
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                >
                    {activeTab === 'config' && (
                        <>
                            <div className="space-y-8">
                                <section className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
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
                                        <input type="range" min="0" max="100" value={config.global_rtp} onChange={(e) => setConfig({ ...config, global_rtp: parseInt(e.target.value) })} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-cyan" />
                                    </div>
                                </section>

                                <section className="glass-panel p-8 rounded-3xl border border-white/10 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/5 blur-3xl rounded-full" />
                                    <div className="flex items-center gap-3 mb-8">
                                        <Activity className="text-neon-green" />
                                        <h2 className="text-xl font-bold uppercase italic tracking-wider">Sesgo de Ruleta</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <label className="text-sm font-bold text-gray-400 uppercase tracking-widest">Margen de la Casa</label>
                                            <span className="text-4xl font-black text-neon-green italic leading-none">{config.roulette_house_margin}%</span>
                                        </div>
                                        <input type="range" min="0" max="100" value={config.roulette_house_margin} onChange={(e) => setConfig({ ...config, roulette_house_margin: parseInt(e.target.value) })} className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-neon-green" />
                                    </div>
                                </section>

                                <button onClick={handleUpdateConfig} disabled={isSaving} className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xl uppercase italic tracking-tighter flex items-center justify-center gap-3 hover:bg-neon-cyan transition-all active:scale-95 disabled:opacity-50">
                                    {isSaving ? <RefreshCw className="animate-spin" /> : <Save />} Guardar Config. Motor
                                </button>
                            </div>

                            <div className="glass-panel p-8 rounded-3xl border border-white/10">
                                <div className="flex items-center gap-3 mb-10">
                                    <TrendingUp className="text-neon-cyan" />
                                    <h2 className="text-xl font-bold uppercase italic tracking-wider">Estadísticas Críticas</h2>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-black mb-2">Profit Bruto</p>
                                        <p className="text-3xl font-black italic tracking-tighter text-neon-green">$ {(stats.total_bets - stats.total_payouts).toLocaleString()}</p>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 uppercase font-black mb-2">RTP Operativo Real</p>
                                        <p className={`text-4xl font-black italic tracking-tighter ${stats.current_rtp > 97 ? 'text-neon-pink' : 'text-neon-cyan'}`}>{stats.current_rtp.toFixed(2)}%</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'payments' && (
                        <div className="col-span-1 lg:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <section className="glass-panel p-8 rounded-3xl border border-white/10">
                                <div className="flex items-center gap-3 mb-8">
                                    <CreditCard className="text-[#F3BA2F]" />
                                    <h2 className="text-xl font-bold uppercase italic tracking-wider">Binance Gateway</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-black mb-2 block">USDT Wallet Address</label>
                                        <input type="text" value={gateways.binance.address} onChange={(e) => setGateways({ ...gateways, binance: { ...gateways.binance, address: e.target.value } })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono focus:border-[#F3BA2F] outline-none" placeholder="0x..." />
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 bg-white/5 p-3 rounded-lg border border-white/5 cursor-pointer" onClick={() => setGateways({ ...gateways, binance: { ...gateways.binance, is_active: !gateways.binance.is_active } })}>
                                        <div className={`w-4 h-4 rounded border ${gateways.binance.is_active ? 'bg-[#F3BA2F] border-[#F3BA2F]' : 'border-gray-600'}`} />
                                        <label className="text-xs font-bold uppercase">Pasarela Activa</label>
                                    </div>
                                </div>
                            </section>

                            <section className="glass-panel p-8 rounded-3xl border border-white/10">
                                <div className="flex items-center gap-3 mb-8">
                                    <CreditCard className="text-neon-cyan" />
                                    <h2 className="text-xl font-bold uppercase italic tracking-wider">Pago Móvil (Venezuela)</h2>
                                </div>
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-black mb-2 block">Teléfono</label>
                                            <input type="text" value={gateways.pago_movil.phone} onChange={(e) => setGateways({ ...gateways, pago_movil: { ...gateways.pago_movil, phone: e.target.value } })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase font-black mb-2 block">Banco</label>
                                            <input type="text" value={gateways.pago_movil.bank} onChange={(e) => setGateways({ ...gateways, pago_movil: { ...gateways.pago_movil, bank: e.target.value } })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 uppercase font-black mb-2 block">Cédula / RIF</label>
                                        <input type="text" value={gateways.pago_movil.ci} onChange={(e) => setGateways({ ...gateways, pago_movil: { ...gateways.pago_movil, ci: e.target.value } })} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-mono" />
                                    </div>
                                    <div className="flex items-center gap-2 mt-4 bg-white/5 p-3 rounded-lg border border-white/5 cursor-pointer" onClick={() => setGateways({ ...gateways, pago_movil: { ...gateways.pago_movil, is_active: !gateways.pago_movil.is_active } })}>
                                        <div className={`w-4 h-4 rounded border ${gateways.pago_movil.is_active ? 'bg-neon-cyan border-neon-cyan' : 'border-gray-600'}`} />
                                        <label className="text-xs font-bold uppercase">Pasarela Activa</label>
                                    </div>
                                </div>
                            </section>

                            <button onClick={handleUpdateGateways} disabled={isSaving} className="col-span-1 lg:col-span-2 py-6 bg-white text-black rounded-[2rem] font-black italic uppercase tracking-tighter hover:bg-neon-cyan transition-all active:scale-95 disabled:opacity-50">
                                {isSaving ? <RefreshCw className="animate-spin text-black" /> : <Save className="text-black" />} Sincronizar Pasarelas de Pago
                            </button>
                        </div>
                    )}

                    {activeTab === 'deposits' && (
                        <div className="col-span-1 lg:col-span-2 glass-panel p-8 rounded-3xl border border-white/10">
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-4">
                                Cola de Depósitos <Clock className="text-neon-pink animate-pulse" />
                            </h2>
                            {pendingDeposits.length === 0 ? (
                                <div className="py-24 text-center">
                                    <CheckCircle size={48} className="mx-auto text-white/10 mb-4" />
                                    <p className="opacity-30 italic uppercase tracking-widest text-sm">Todo procesado. Sin depósitos pendientes.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingDeposits.map((dep) => (
                                        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={dep.id} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                                            <div className="flex gap-6 items-center">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${dep.method === 'binance' ? 'bg-[#F3BA2F]/20 border-[#F3BA2F]/50 text-[#F3BA2F]' : 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan'}`}>
                                                    <CreditCard size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-gray-500 mb-1">{dep.method} • {new Date(dep.created_at).toLocaleString()}</p>
                                                    <p className="text-2xl font-black italic tracking-tighter text-white">${dep.amount.toLocaleString()}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-mono text-neon-cyan bg-neon-cyan/10 px-2 py-0.5 rounded">REF: {dep.reference}</span>
                                                        <span className="text-[10px] text-gray-500 font-bold uppercase truncate max-w-[150px]">UID: {dep.user_id}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button onClick={() => approveDeposit(dep.id)} className="px-8 py-3 bg-neon-green text-black rounded-xl font-black text-xs uppercase hover:scale-105 hover:shadow-[0_0_20px_#00ff9d] transition-all">Aprobar</button>
                                                <button className="px-8 py-3 bg-white/5 text-neon-pink border border-neon-pink/30 rounded-xl font-black text-xs uppercase hover:bg-neon-pink hover:text-white transition-all">Rechazar</button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AntigravityConsole;
