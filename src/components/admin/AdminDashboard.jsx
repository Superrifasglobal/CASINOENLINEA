import React, { useState } from 'react';
import { LayoutDashboard, ShieldCheck, Users, Settings, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import VaultCard from './VaultCard';
import UserControlTable from './UserControlTable';
import RTPManager from './RTPManager';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    const tabs = [
        { id: 'overview', label: 'Bóveda', icon: LayoutDashboard },
        { id: 'users', label: 'Jugadores', icon: Users },
        { id: 'security', label: 'Seguridad', icon: ShieldCheck },
        { id: 'settings', label: 'RTP Global', icon: Settings },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white p-8 font-sans bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-neon-blue/10 via-transparent to-transparent">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent italic uppercase">
                            Panel de Control Nex Medina
                        </h1>
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Admin Central • Antigravity Console</p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
                        <div className="flex items-center gap-2 px-3">
                            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse shadow-[0_0_10px_#00FF9D]" />
                            <span className="text-[10px] font-bold text-neon-green">SISTEMA ONLINE</span>
                        </div>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5 backdrop-blur-md w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${activeTab === tab.id
                                ? 'bg-white/10 text-white shadow-lg border border-white/10'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <tab.icon size={18} />
                            <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="grid grid-cols-1 gap-8"
                >
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2">
                                <VaultCard />
                            </div>
                            <div className="glass-panel p-6 rounded-3xl border border-white/10 bg-black/40 h-fit">
                                <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Activity size={16} className="text-neon-blue" /> Actividad Reciente
                                </h3>
                                <div className="space-y-4">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex flex-col gap-1 pb-4 border-b border-white/5 last:border-0">
                                            <span className="text-[10px] text-gray-500">Hace 2 minutos</span>
                                            <p className="text-xs">Usuario <span className="text-neon-green">#432</span> apostó <span className="font-mono">0.05 ETH</span> en Ruleta</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && <UserControlTable />}

                    {activeTab === 'settings' && <RTPManager />}
                </motion.div>
            </div>
        </div>
    );
};

export default AdminDashboard;
