import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, Smile, Gift, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

const GlobalChat = ({ user, isOpen, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineCount, setOnlineCount] = useState(1); // Mock start
    const messagesEndRef = useRef(null);

    // Initial Mock Data
    useEffect(() => {
        setMessages([
            { id: 1, user: 'CryptoKing', text: '¡Esta racha de Crash es increíble!', time: '10:42', role: 'user', level: 12 },
            { id: 2, user: 'Admin', text: 'Bienvenidos a Antigravity. ¡Suerte a todos!', time: '10:45', role: 'admin', level: 99 },
            { id: 3, user: 'SarahCoin', text: 'Alguien para jugar slots?', time: '10:48', role: 'vip', level: 45 },
        ]);
        setOnlineCount(Math.floor(Math.random() * 200) + 50);
    }, []);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        // Optimistic update
        const msg = {
            id: Date.now(),
            user: user?.email ? user.email.split('@')[0] : 'Guest',
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            role: user ? 'user' : 'guest',
            level: user?.level || 1
        };

        setMessages(prev => [...prev, msg]);
        setNewMessage('');

        // TODO: Send to Supabase Realtime here
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-full w-80 bg-[#0f0f13] border-l border-white/5 z-50 flex flex-col shadow-2xl shadow-black/50"
        >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-[#141419] flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-neon-green/80 animate-pulse absolute top-0 right-0" />
                        <Users size={18} className="text-gray-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm tracking-wide">CHAT GLOBAL</h3>
                        <span className="text-[10px] text-neon-green font-mono">{onlineCount} EN LÍNEA</span>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#0f0f13]">
                {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col animate-fadeIn">
                        <div className="flex items-baseline gap-2 mb-1">
                            {msg.role === 'admin' && (
                                <span className="bg-neon-pink text-[9px] font-black px-1 rounded text-black uppercase">MOD</span>
                            )}
                            {msg.role === 'vip' && (
                                <span className="bg-yellow-500 text-[9px] font-black px-1 rounded text-black uppercase">VIP</span>
                            )}
                            <span className={`text-xs font-bold ${msg.role === 'admin' ? 'text-neon-pink' : 'text-gray-300'}`}>
                                {msg.user}
                            </span>
                            <span className="text-[10px] text-gray-600 font-mono">{msg.level && `Lvl ${msg.level}`}</span>
                        </div>
                        <div className="bg-[#1a1a20] p-3 rounded-r-xl rounded-bl-xl text-xs text-gray-200 leading-relaxed shadow-sm border border-white/[0.02]">
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-[#141419] border-t border-white/5">
                <form onSubmit={handleSendMessage} className="relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe un mensaje..."
                        className="w-full bg-[#0a0a0c] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs text-white focus:outline-none focus:border-neon-blue/50 focus:bg-[#0f0f13] transition-all"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-neon-blue/10 text-neon-blue hover:bg-neon-blue/20 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    >
                        <Send size={14} />
                    </button>
                </form>
                <div className="flex justify-between mt-3 px-1">
                    <button className="text-gray-500 hover:text-neon-pink transition-colors text-[10px] flex items-center gap-1">
                        <Gift size={12} /> Rain
                    </button>
                    <button className="text-gray-500 hover:text-yellow-400 transition-colors text-[10px] flex items-center gap-1">
                        <Smile size={12} /> Emojis
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default GlobalChat;
