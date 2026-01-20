import React from 'react';
import { LayoutDashboard, Users, History, Settings, LogOut, TrendingUp, DollarSign, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminSidebar = ({ activeView, setActiveView }) => {
    const menuItems = [
        { id: 'summary', label: 'Resumen', icon: LayoutDashboard },
        { id: 'players', label: 'Jugadores', icon: Users },
        { id: 'transactions', label: 'Transacciones', icon: History },
        { id: 'settings', label: 'Configuración de Juegos', icon: Settings },
    ];

    return (
        <div className="w-64 bg-surface border-r border-white/5 h-screen fixed left-0 top-0 flex flex-col p-6">
            <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-8 h-8 bg-neon-purple rounded-lg shadow-[0_0_15px_rgba(176,38,255,0.4)] flex items-center justify-center font-bold">A</div>
                <h2 className="text-xl font-bold tracking-tight text-white">Admin<span className="text-neon-purple">Panel</span></h2>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => setActiveView(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${activeView === item.id
                                ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.label}</span>
                        {activeView === item.id && (
                            <motion.div
                                layoutId="admin-active-pill"
                                className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-purple shadow-[0_0_8px_#b026ff]"
                            />
                        )}
                    </button>
                ))}
            </nav>

            <div className="mt-auto pt-6 border-t border-white/5">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-400/5 transition-all outline-none">
                    <LogOut size={20} />
                    <span className="font-medium">Salir del Panel</span>
                </button>
            </div>
        </div>
    );
};

export const AdminLayout = ({ children, activeView, setActiveView }) => {
    return (
        <div className="min-h-screen bg-background text-white flex">
            <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
            <main className="flex-1 ml-64 p-8 overflow-y-auto">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Panel de Control</h1>
                        <p className="text-gray-400 text-sm mt-1">Bienvenido de nuevo, Administrador.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="px-4 py-2 bg-surface border border-white/5 rounded-lg flex items-center gap-2 text-sm text-gray-400">
                            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
                            Sistemas Operativos
                        </div>
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
};
