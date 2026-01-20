import React, { useState, useEffect } from 'react';
import { Wallet, Landmark, TrendingUp, ArrowRightCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const VaultCard = () => {
    const [stats, setStats] = useState({
        totalWallet: 0,
        playerDebts: 0,
        retirableProfit: 0
    });
    const [loading, setLoading] = useState(true);
    const [transferring, setTransferring] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [walletAddress, setWalletAddress] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/vault', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || '29971627Nex@'}` }
                });
                const data = await res.json();
                setStats(data.vault);
            } catch (err) {
                console.error('Failed to fetch vault stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleWithdraw = async (e) => {
        e.preventDefault();
        if (parseFloat(withdrawAmount) > stats.retirableProfit) {
            alert('Error: No puedes retirar más de la ganancia neta.');
            return;
        }

        setTransferring(true);
        // Simulate contract interaction
        setTimeout(() => {
            alert('Transferencia ejecutada con éxito vía withdrawHouseEarnings()');
            setTransferring(false);
            setWithdrawAmount('');
        }, 2000);
    };

    const formatCurrency = (val) => val.toFixed(4) + ' ETH';

    return (
        <div className="flex flex-col gap-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/30 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <Wallet className="text-neon-blue" size={20} />
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">Total en Bóveda</span>
                    </div>
                    <div className="text-2xl font-mono font-black text-white">
                        {loading ? '...' : formatCurrency(stats.totalWallet)}
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Wallet size={80} />
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-black/30 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldAlert className="text-neon-pink" size={20} />
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">Saldo Reservado</span>
                    </div>
                    <div className="text-2xl font-mono font-black text-white">
                        {loading ? '...' : formatCurrency(stats.playerDebts)}
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <ShieldAlert size={80} />
                    </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-neon-green/20 bg-neon-green/5 relative overflow-hidden group">
                    <div className="flex items-center gap-3 mb-2">
                        <TrendingUp className="text-neon-green" size={20} />
                        <span className="text-[10px] font-black tracking-widest uppercase text-gray-400 text-neon-green">Ganancia Retirable</span>
                    </div>
                    <div className="text-3xl font-mono font-black text-neon-green drop-shadow-[0_0_10px_rgba(0,255,157,0.3)]">
                        {loading ? '...' : formatCurrency(stats.retirableProfit)}
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                        <TrendingUp size={80} />
                    </div>
                </div>
            </div>

            {/* Withdrawal Form */}
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40">
                <div className="flex items-center gap-3 mb-6">
                    <Landmark className="text-neon-blue" size={24} />
                    <h3 className="text-xl font-black italic">Retirar Utilidades a Cuenta Personal</h3>
                </div>

                <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Dirección de Destino</label>
                        <input
                            type="text"
                            required
                            placeholder="0x..."
                            value={walletAddress}
                            onChange={(e) => setWalletAddress(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-neon-blue/50"
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Monto a Retirar (ETH)</label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                step="0.001"
                                placeholder="0.00"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-mono focus:outline-none focus:border-neon-blue/50"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500">ETH</span>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <button
                            type="submit"
                            disabled={transferring || !withdrawAmount || !walletAddress}
                            className="w-full group flex items-center justify-center gap-3 bg-gradient-to-r from-neon-blue to-blue-600 text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-neon-blue/20 transition-all disabled:opacity-30"
                        >
                            {transferring ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <ArrowRightCircle size={20} className="group-hover:translate-x-1 transition-transform" />
                            )}
                            EJECUTAR WITHDRAWHOUSEEARNINGS()
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VaultCard;
