import React from 'react';
import { Bell, Search, Wallet, User as UserIcon, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import WalletManager from './WalletManager';

const Header = ({ user, onLoginClick }) => {
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
                        placeholder="Search games..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-neon-green/30 focus:bg-white/10 transition-all shadow-inner"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
                <WalletManager />

                <div className="flex items-center gap-2">
                    <button className="relative p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all ring-1 ring-white/5 hover:ring-white/20">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-neon-pink rounded-full shadow-[0_0_8px_#ff007f]" />
                    </button>

                    <button
                        onClick={onLoginClick}
                        className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                    >
                        <div className="flex items-center gap-3 px-2">
                            {user ? (
                                <span className="text-xs font-black uppercase tracking-widest text-white">{user.username}</span>
                            ) : (
                                <span className="text-xs font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Entrar</span>
                            )}
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-purple to-neon-blue p-[1px]">
                            <div className="w-full h-full rounded-lg bg-black flex items-center justify-center">
                                <UserIcon size={16} className="text-white group-hover:text-neon-blue transition-colors" />
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;

