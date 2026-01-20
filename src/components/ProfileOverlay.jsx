import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Copy, LogOut, AlertTriangle, Wallet } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ProfileOverlay = ({ isOpen, onClose, user, onLogout }) => {
    if (!isOpen || !user) return null;

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        // Could add a toast notification here
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-lg glass-panel p-8 rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-blue/20 blur-[80px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-neon-purple/20 blur-[80px] rounded-full" />

                {/* Header */}
                <div className="flex justify-between items-start mb-8 relative">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Perfil</h2>
                        <p className="text-sm text-gray-400 mt-1">Tu información personal y de la cuenta.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-4 mb-8 relative bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple p-[2px]">
                        <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                                {user.username ? user.username[0].toUpperCase() : 'U'}
                            </span>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{user.username}</h3>
                        <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                </div>

                {/* UID Section */}
                <div className="mb-8 relative">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">
                        Tu ID de Usuario (UID)
                    </label>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-300 font-mono truncate">
                            {user.id}
                        </div>
                        <button
                            onClick={() => copyToClipboard(user.id)}
                            className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                            title="Copiar UID"
                        >
                            <Copy size={18} className="text-gray-400 hover:text-white" />
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-2">Usa este UID para consultas de soporte.</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mb-8 relative">
                    <button className="flex-1 bg-neon-green hover:bg-neon-green/90 text-black font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-neon-green/20">
                        Actualizar Perfil
                    </button>
                    <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-4 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2">
                        <Wallet size={18} />
                        Depositar
                    </button>
                </div>



                {/* Logout Button (Bottom Right or separate) */}
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
                    >
                        <LogOut size={16} />
                        Cerrar Sesión
                    </button>
                </div>

            </motion.div>
        </div>
    );
};

export default ProfileOverlay;
