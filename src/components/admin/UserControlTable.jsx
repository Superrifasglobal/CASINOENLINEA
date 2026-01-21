import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Ban, Search, ChevronLeft, ChevronRight, Gavel, UserX } from 'lucide-react';
import { motion } from 'framer-motion';

const UserControlTable = () => {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Now calling our real serverless function
                const res = await fetch('/api/users');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();

                // If API returns error (e.g. missing key), fallback gracefully or show alert
                if (data.error) {
                    console.warn("API Error:", data.details || data.error);
                    setError(data.details || data.error);
                }

                if (data.users) {
                    setUsers(data.users);
                }
            } catch (err) {
                console.error('Failed to fetch users:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, [page]);

    const handleBan = async (id) => {
        if (!confirm(`¿Estás seguro de banear permanentemente al usuario ${id}?`)) return;

        // Optimistic UI update
        setUsers(users.map(u => u.id === id ? { ...u, status: 'BANNED' } : u));

        // Simulating API call
        // In real app: call supabase.rpc('ban_user', { user_id: id })
    };

    return (
        <div className="glass-panel rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ID..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-mono focus:outline-none focus:border-neon-blue/50 text-white"
                    />
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5 transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span className="flex items-center px-4 font-mono text-xs text-gray-400">Página {page}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 border border-white/5 transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02]">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Usuario / ID</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Saldo</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Nivel</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Última Actividad</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-8 bg-white/[0.01]" />
                                </tr>
                            ))
                        ) : (
                            users.filter(u => u.id.toLowerCase().includes(search.toLowerCase()) || (u.email && u.email.toLowerCase().includes(search.toLowerCase()))).map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-white mb-0.5">{user.email || 'Anónimo'}</span>
                                            <span className="text-[9px] font-mono text-gray-500">{user.id}</span>
                                            <span className={`text-[9px] font-bold mt-1 w-fit px-1.5 py-0.5 rounded ${user.status === 'ACTIVE' ? 'bg-neon-green/10 text-neon-green' : 'bg-neon-pink/10 text-neon-pink'}`}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono font-bold text-white">{parseFloat(user.balance).toLocaleString()} USD</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-300">Lvl {user.level}</span>
                                            <span className="text-[9px] text-gray-500 uppercase">{user.xp.toLocaleString()} XP</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-gray-400">{new Date(user.last_bet).toLocaleDateString()}</span>
                                        <div className="text-[9px] text-gray-600">{new Date(user.last_bet).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleBan(user.id)}
                                            disabled={user.status === 'BANNED'}
                                            className="p-2 rounded-lg bg-neon-pink/10 text-neon-pink opacity-50 hover:opacity-100 transition-all hover:bg-neon-pink/20 disabled:cursor-not-allowed disabled:grayscale"
                                            title="Banear Usuario"
                                        >
                                            <UserX size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && error && (
                <div className="p-10 text-center text-neon-pink text-xs uppercase tracking-widest font-bold">
                    Error del Sistema: {error}
                </div>
            )}

            {!loading && !error && users.length === 0 && (
                <div className="p-10 text-center text-gray-500 text-xs uppercase tracking-widest italic">
                    No se encontraron exploradores en este sector
                </div>
            )}
        </div>
    );
};

export default UserControlTable;
