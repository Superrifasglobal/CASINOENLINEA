import React, { useState, useEffect } from 'react';
import { Ban, Search, ChevronLeft, ChevronRight, Gavel, UserX } from 'lucide-react';
import { motion } from 'framer-motion';

const UserControlTable = () => {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/users-list?page=${page}`, {
                    headers: { 'Authorization': 'Bearer ADMIN_TOKEN' }
                });
                const data = await res.json();
                setUsers(data.users);
            } catch (err) {
                console.error('Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [page]);

    const handleBan = async (id) => {
        if (!confirm(`¿Estás seguro de banear permanentemente al usuario ${id}?`)) return;

        try {
            const res = await fetch('/api/admin/user-action', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ADMIN_TOKEN'
                },
                body: JSON.stringify({ targetUserId: id, action: 'ban' })
            });
            if (res.ok) {
                setUsers(users.map(u => u.id === id ? { ...u, status: 'BANNED' } : u));
            }
        } catch (err) {
            alert('Error al ejecutar el baneo');
        }
    };

    return (
        <div className="glass-panel rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
            {/* Table Header Controls */}
            <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                    <input
                        type="text"
                        placeholder="Buscar por ID de Wallet..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-mono focus:outline-none focus:border-neon-blue/50"
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
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Usuario</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Saldo</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Nivel/Rank</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Última Apuesta</th>
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
                            users.filter(u => u.id.includes(search)).map((user) => (
                                <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-white">{user.id}</span>
                                            <span className={`text-[9px] font-bold ${user.status === 'ACTIVE' ? 'text-neon-green' : 'text-neon-pink'}`}>
                                                {user.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-mono font-bold">{user.balance.toFixed(4)} ETH</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-300">Lvl {user.level}</span>
                                            <span className="text-[9px] text-gray-500 uppercase">{user.xp} XP</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs text-gray-400">{user.last_bet ? new Date(user.last_bet).toLocaleString() : 'Nunca'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleBan(user.id)}
                                            disabled={user.status === 'BANNED'}
                                            className="p-2 rounded-lg bg-neon-pink/10 text-neon-pink opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neon-pink/20 disabled:hidden"
                                            title="Banear IP y Cuenta"
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

            {!loading && users.length === 0 && (
                <div className="p-10 text-center text-gray-500 text-xs uppercase tracking-widest italic">
                    No se encontraron exploradores en este sector
                </div>
            )}
        </div>
    );
};

export default UserControlTable;
