import React from 'react';
import { motion } from 'framer-motion';
import { User, ShieldCheck, Wallet, LogOut } from 'lucide-react';

const Navbar = ({ session, onLogout }) => {
    const user = session?.user;
    const isAdmin = user?.role === 'ADMIN';

    return (
        <nav className="w-full h-20 bg-black/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 fixed top-0 z-50">
            {/* Logo Area */}
            <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.5)]">
                    <span className="text-white font-bold text-xl">N</span>
                </div>
                <span className="text-white font-bold text-xl tracking-wider hidden sm:block">
                    NEX<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">MEDINA</span>
                </span>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
                {/* Super Admin Golden Button */}
                {user?.email === 'nexjmr07@gmail.com' && (
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(234, 179, 8, 0.8)" }}
                        whileTap={{ scale: 0.95 }}
                        className="hidden lg:flex relative group px-6 py-2.5 rounded-full bg-black border border-yellow-500/80 
                                text-yellow-400 font-bold tracking-wide uppercase
                                shadow-[0_0_20px_rgba(234,179,8,0.5)]
                                transition-all duration-300 overflow-hidden mr-2"
                    >
                        <div className="absolute inset-0 bg-yellow-400/10 group-hover:bg-yellow-400/20 transition-colors animate-pulse" />
                        <span className="relative z-10 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5" /> PANEL MAESTRO
                        </span>
                    </motion.button>
                )}

                {isAdmin ? (
                    /* Admin Floating Button - Antigravity Style */
                    <motion.button
                        whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(168, 85, 247, 0.6)" }}
                        whileTap={{ scale: 0.95 }}
                        className="relative group px-6 py-2.5 rounded-full bg-black border border-fuchsia-500/50 
                       text-fuchsia-400 font-medium tracking-wide
                       shadow-[0_0_15px_rgba(168,85,247,0.3)]
                       transition-all duration-300 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-fuchsia-500/10 group-hover:bg-fuchsia-500/20 transition-colors" />
                        <div className="flex items-center gap-2 relative z-10">
                            <ShieldCheck className="w-5 h-5" />
                            <span>Panel de Control</span>
                        </div>
                        {/* Glitch/Scanline effect overlay could go here */}
                    </motion.button>
                ) : (
                    /* User Stats & Actions */
                    <div className="flex items-center gap-4">
                        {/* Balance Display */}
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-xs text-gray-400 uppercase tracking-widest">Balance</span>
                            <div className="flex items-center gap-2 text-emerald-400 font-mono text-lg font-bold drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                                <Wallet className="w-4 h-4" />
                                <span>${user?.balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                        </div>

                        {/* Profile Button */}
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-white hover:border-violet-500 hover:text-violet-400 transition-colors overflow-hidden"
                        >
                            {user?.image ? (
                                <img src={user.image} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5" />
                            )}
                        </motion.button>
                    </div>
                )}

                {/* Common Logout Button */}
                {user && (
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-full hover:bg-white/5"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
