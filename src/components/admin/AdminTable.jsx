import React, { useState } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const mockTransactions = [
    { id: 'tx_001', userId: 'user_x92', type: 'bet', amount: 50.00, game: 'Roulette', status: 'completed', time: '14:20' },
    { id: 'tx_002', userId: 'user_a44', type: 'prize', amount: 120.50, game: 'Slots', status: 'completed', time: '14:15' },
    { id: 'tx_003', userId: 'user_k21', type: 'bet', amount: 10.00, game: 'Blackjack', status: 'pending', time: '14:10' },
    { id: 'tx_004', userId: 'user_x92', type: 'bet', amount: 100.00, game: 'Roulette', status: 'completed', time: '14:05' },
    { id: 'tx_005', userId: 'user_m77', type: 'prize', amount: 500.00, game: 'Lightning Cards', status: 'completed', time: '13:58' },
];

export const AdminTable = () => {
    const [filter, setFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

    const filteredData = mockTransactions.filter(tx =>
        (tx.userId.toLowerCase().includes(filter.toLowerCase()) || tx.game.toLowerCase().includes(filter.toLowerCase())) &&
        (typeFilter === 'all' || tx.type === typeFilter)
    );

    return (
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Últimos Movimientos</h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por Usuario o Juego..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-neon-purple/50 w-64 transition-all"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-xl py-2 px-4 text-sm focus:outline-none focus:border-neon-purple/50 outline-none"
                    >
                        <option value="all">Todos los Tipos</option>
                        <option value="bet">Apuestas</option>
                        <option value="prize">Premios</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] text-gray-400 text-xs uppercase tracking-wider font-semibold">
                            <th className="px-6 py-4">ID Transacción</th>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Juego</th>
                            <th className="px-6 py-4">Monto</th>
                            <th className="px-6 py-4">Tipo</th>
                            <th className="px-6 py-4">Hora</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05]">
                        {filteredData.map((tx) => (
                            <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4 font-mono text-xs text-gray-400">{tx.id}</td>
                                <td className="px-6 py-4 font-medium">{tx.userId}</td>
                                <td className="px-6 py-4 text-sm text-gray-300">{tx.game}</td>
                                <td className="px-6 py-4 font-bold">
                                    <span className={tx.type === 'prize' ? 'text-neon-green' : 'text-white'}>
                                        {tx.type === 'prize' ? '+' : '-'}${tx.amount.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${tx.type === 'bet'
                                            ? 'bg-blue-400/5 text-blue-400 border-blue-400/20'
                                            : 'bg-neon-green/5 text-neon-green border-neon-green/20'
                                        }`}>
                                        {tx.type === 'bet' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                                        {tx.type === 'bet' ? 'Apuesta' : 'Premio'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-500 text-sm">{tx.time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredData.length === 0 && (
                <div className="p-10 text-center text-gray-500 italic">No se encontraron movimientos.</div>
            )}
        </div>
    );
};
