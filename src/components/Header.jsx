import React from 'react';
import { Bell, Search, Wallet, User as UserIcon, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import WalletManager from './WalletManager';

const Header = ({ user, balance, onLoginClick }) => {
    return (
        <header className="h-20 flex items-center justify-between px-4 md:px-8 z-40 relative">
            <div className="flex items-center gap-4 md:hidden">
                <button className="p-2 text-gray-400 hover:text-white glass-button">
                    <Menu size={20} />
                </button>
                <div className="text-xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-neon-green to-neon-blue">
                    GRAVITY
                </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl mx-8">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-neon-green transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar juegos, torneos..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-blue/30 focus:bg-white/[0.08] transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5 text-neon-green shadow-xl"
                >
                    <Wallet size={16} className="text-neon-green/70" />
                    <span className="text-sm font-mono font-black tracking-tight">
                        ${(Number(balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </motion.div>

                <WalletManager />

                <div className="flex items-center gap-2">
                    <button className="relative p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-all border border-white/5">
                        <Bell size={20} />
                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-neon-pink rounded-full shadow-[0_0_8px_#ff007f]" />
                    </button>

                    <button
                        onClick={user ? undefined : onLoginClick}
                        className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-white/20 transition-all group"
                    >
                        <div className="flex items-center gap-3 px-2">
                            {user ? (
                                <span className="text-xs font-black uppercase tracking-widest text-white/90">{user.username}</span>
                            ) : (
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Entrar</span>
                            )}
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-neon-purple to-neon-blue p-[1px] shadow-lg">
                            <div className="w-full h-full rounded-xl bg-background flex items-center justify-center">
                                <UserIcon size={18} className="text-white group-hover:text-neon-blue transition-colors" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
