import React, { useState } from 'react';
import { Home, Gamepad2, Tv, Dices, Trophy, CreditCard, ChevronLeft, Hexagon } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ activeCategory, onCategoryChange }) => {
    const active = activeCategory;
    const setActive = onCategoryChange;

    const menuItems = [
        { label: 'Home', icon: Home, id: 'Home' },
        { label: 'Slots', icon: Gamepad2, id: 'Slots' },
        { label: 'Live Casino', icon: Tv, id: 'Live' },
        { label: 'Table Games', icon: Dices, id: 'Tables' },
        { label: 'Originals', icon: Hexagon, id: 'Originals' },
        { label: 'Sports', icon: Trophy, id: 'Sports' },
    ];

    return (
        <motion.aside
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-20 md:w-64 h-full flex-col hidden md:flex relative z-50 ml-4 py-4"
        >
            <div className="flex-1 glass-panel rounded-2xl flex flex-col p-4 overflow-hidden">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="w-8 h-8 rounded-lg bg-neon-green/20 flex items-center justify-center border border-neon-green/50 shadow-[0_0_15px_rgba(0,255,157,0.3)]">
                        <Hexagon size={18} className="text-neon-green" />
                    </div>
                    <span className="font-bold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-neon-green to-neon-blue hidden md:block">
                        GRAVITY
                    </span>
                </div>

                <nav className="flex flex-col gap-2">
                    {menuItems.map((item) => {
                        const isActive = active === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActive(item.id)}
                                className={`relative group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-neon-green/10 border border-neon-green/20 rounded-xl shadow-[0_0_10px_rgba(0,255,157,0.1)]"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon size={20} className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110 text-neon-green' : 'group-hover:scale-110'}`} />
                                <span className="relative z-10 font-medium hidden md:block">{item.label}</span>

                                {!isActive && (
                                    <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-neon-purple/20 blur-2xl rounded-full -mr-8 -mt-8" />

                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <span className="text-xs text-gray-400 font-medium">VIP LEVEL</span>
                            <span className="text-xs text-neon-purple font-bold">PLATINUM</span>
                        </div>

                        <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden relative z-10">
                            <motion.div
                                className="h-full bg-gradient-to-r from-neon-purple to-neon-pink"
                                initial={{ width: 0 }}
                                animate={{ width: '75%' }}
                                transition={{ duration: 1.5, delay: 0.5 }}
                            />
                        </div>

                        <button className="w-full mt-3 py-2 rounded-lg bg-neon-purple/10 border border-neon-purple/30 text-xs text-neon-purple font-bold hover:bg-neon-purple/20 transition-all flex items-center justify-center gap-2 relative z-10">
                            <CreditCard size={14} />
                            View Benefits
                        </button>
                    </div>
                </div>
            </div>
        </motion.aside>
    );
};

export default Sidebar;

