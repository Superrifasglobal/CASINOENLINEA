import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Search, RefreshCw, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DepositManager = () => {
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('pending');
    const [processingId, setProcessingId] = useState(null);

    useEffect(() => {
        fetchDeposits();
    }, []);

    const fetchDeposits = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/deposits');
            const data = await res.json();
            if (data.deposits) {
                setDeposits(data.deposits);
            }
        } catch (err) {
            console.error('Error fetching deposits:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (depositId, action) => {
        if (!confirm(`¿Estás seguro de ${action === 'approve' ? 'APROBAR' : 'RECHAZAR'} este depósito?`)) return;

        setProcessingId(depositId);
        try {
            const res = await fetch('/api/deposits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ depositId, action })
            });
            const data = await res.json();

            if (data.success) {
                // Refresh list
                await fetchDeposits();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            console.error('Action error:', err);
            alert('Error crítico de red');
        } finally {
            setProcessingId(null);
        }
    };

    const filteredDeposits = deposits.filter(d => {
        const matchesSearch = d.reference?.toLowerCase().includes(filter.toLowerCase()) ||
            d.profiles?.email?.toLowerCase().includes(filter.toLowerCase());
        const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por Referencia o Email..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-neon-blue/50 w-64 text-white"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-xs text-gray-300 outline-none focus:border-neon-blue/50"
                    >
                        <option value="pending">Pendientes</option>
                        <option value="completed">Completados</option>
                        <option value="failed">Rechazados</option>
                        <option value="all">Todos</option>
                    </select>
                </div>
                <button
                    onClick={fetchDeposits}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                >
                    <RefreshCw size={18} />
                </button>
            </div>

            <div className="glass-panel overflow-hidden border border-white/5 rounded-3xl bg-black/20">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Monto</th>
                            <th className="px-6 py-4">Método</th>
                            <th className="px-6 py-4">Referencia</th>
                            <th className="px-6 py-4">Fecha</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        <AnimatePresence>
                            {loading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-10 bg-white/[0.01]" />
                                    </tr>
                                ))
                            ) : filteredDeposits.map((d) => (
                                <motion.tr
                                    key={d.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white">{d.profiles?.display_name || 'Usuario'}</span>
                                            <span className="text-[9px] text-gray-500 font-mono">{d.profiles?.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-black text-neon-green">${d.amount.toFixed(2)}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{d.method}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <code className="text-[10px] bg-black/50 px-2 py-1 rounded border border-white/5 text-gray-300">{d.reference}</code>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-[10px] text-gray-500">
                                            {new Date(d.created_at).toLocaleDateString()}<br />
                                            {new Date(d.created_at).toLocaleTimeString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {d.status === 'pending' ? (
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleAction(d.id, 'approve')}
                                                    disabled={processingId === d.id}
                                                    className="p-2 rounded-xl bg-neon-green/10 text-neon-green hover:bg-neon-green/20 transition-all disabled:opacity-50"
                                                    title="Aprobar Pago"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleAction(d.id, 'reject')}
                                                    disabled={processingId === d.id}
                                                    className="p-2 rounded-xl bg-neon-pink/10 text-neon-pink hover:bg-neon-pink/20 transition-all disabled:opacity-50"
                                                    title="Rechazar Pago"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${d.status === 'completed' ? 'bg-neon-green/10 text-neon-green border-neon-green/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}>
                                                {d.status === 'completed' ? 'Aprobado' : 'Rechazado'}
                                            </span>
                                        )}
                                    </td>
                                </motion.tr>
                            ))}
                        </AnimatePresence>
                    </tbody>
                </table>
                {!loading && filteredDeposits.length === 0 && (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <Clock size={48} className="text-gray-700" />
                        <p className="text-gray-500 text-xs font-black uppercase tracking-[0.2em]">No hay depósitos pendientes en este sector</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DepositManager;
