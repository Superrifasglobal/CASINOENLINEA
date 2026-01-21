import React, { useState } from 'react';
import { LayoutDashboard, ShieldCheck, Users, Settings, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import VaultCard from './VaultCard';
import UserControlTable from './UserControlTable';
import RTPManager from './RTPManager';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Bóveda & Stats', icon: LayoutDashboard },
        { id: 'users', label: 'Jugadores', icon: Users },
        { id: 'security', label: 'Seguridad', icon: ShieldCheck },
        { id: 'settings', label: 'RTP Global', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-background text-white p-6 md:p-12 font-sans relative overflow-hidden">
            {/* Background Aurora Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-blue/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-purple/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto flex flex-col gap-10 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-purple to-neon-blue p-[1px]">
                                <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                                    <Activity size={20} className="text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tighter bg-gradient-to-r from-white via-white to-gray-500 bg-clip-text text-transparent italic uppercase">
                                Antigravity Console
                            </h1>
                        </div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em] ml-1">Admin Central • Operaciones Globales</p>
                    </div>

                    <div className="flex items-center gap-4 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-neon-green" />
                                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-neon-green animate-ping" />
                            </div>
                            <span className="text-[10px] font-black text-neon-green tracking-widest uppercase">Sistema Operativo</span>
                        </div>
                    </div>
                </div>

                {/* Action Bar & Tabs */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-2">
                    <div className="flex gap-2 bg-white/[0.03] p-1.5 rounded-2xl border border-white/5 backdrop-blur-md w-fit">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all duration-500 ${activeTab === tab.id
                                    ? 'bg-white/10 text-white shadow-2xl border border-white/10'
                                    : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
                                    }`}
                            >
                                <tab.icon size={18} />
                                <span className="text-[10px] font-black uppercase tracking-widest leading-none">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="glass-button text-[10px] font-black uppercase tracking-widest">
                            Reporte 24h
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="w-full"
                    >
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                <div className="lg:col-span-8">
                                    <VaultCard />
                                </div>
                                <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit">
                                    <div className="premium-card p-6">
                                        <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                                            <span className="flex items-center gap-2">
                                                <Activity size={16} className="text-neon-blue" /> Terminal de Actividad
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-mono">LIVE</span>
                                        </h3>
                                        <div className="space-y-6">
                                            {[
                                                { time: 'AHORA', user: '#nexjmr07', action: 'Depósito ETH', amount: '0.25', type: 'positive' },
                                                { time: '2m', user: '#guest23', action: 'Apuesta Ruleta', amount: '0.01', type: 'neutral' },
                                                { time: '5m', user: '#user88', action: 'Retiro G-Profit', amount: '0.12', type: 'negative' },
                                            ].map((log, i) => (
                                                <div key={i} className="flex gap-4 group cursor-pointer hover:translate-x-1 transition-transform">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${log.type === 'positive' ? 'bg-neon-green' : log.type === 'negative' ? 'bg-neon-pink' : 'bg-neon-blue'}`} />
                                                        <div className="w-[1px] h-full bg-white/5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center mb-1">
                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{log.time}</span>
                                                            <span className={`text-[10px] font-mono ${log.type === 'positive' ? 'text-neon-green' : log.type === 'negative' ? 'text-neon-pink' : 'text-neon-blue'}`}>
                                                                {log.type === 'positive' ? '+' : log.type === 'negative' ? '-' : ''}{log.amount} ETH
                                                            </span>
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-300">
                                                            <span className="text-white">{log.user}</span> • {log.action}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="w-full mt-8 py-3 rounded-xl bg-white/[0.03] border border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all">
                                            Ver Logs Completos
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="premium-card">
                                <UserControlTable />
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="premium-card max-w-2xl">
                                <RTPManager />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default AdminDashboard;
