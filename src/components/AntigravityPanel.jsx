import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Zap, Info, Share2 } from 'lucide-react';
import SpaceRoulette from './SpaceRoulette';

const AntigravityPanel = () => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [hasWon, setHasWon] = useState(false);

    const handleTestSpin = () => {
        setIsSpinning(true);
        setHasWon(false);

        // Simulate a result after 3 seconds
        setTimeout(() => {
            setIsSpinning(false);
            const win = Math.random() > 0.5;
            setHasWon(win);

            if (win) {
                // Reset win effect after 5 seconds
                setTimeout(() => setHasWon(false), 5000);
            }
        }, 3000);
    };

    return (
        <div className="relative group">
            {/* 3D Scene Container */}
            <div className="relative h-[500px] w-full rounded-3xl overflow-hidden glass-morphism border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-black">
                <SpaceRoulette isSpinning={isSpinning} win={hasWon} />

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                {/* Floating UI Elements over 3D Scene */}
                <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-20">
                    <div className="space-y-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-[10px] font-bold uppercase tracking-widest"
                        >
                            <Zap size={12} fill="currentColor" />
                            Live Multiplier: 2.50x
                        </motion.div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                            NEON<br />ROULETTE
                        </h1>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleTestSpin}
                            disabled={isSpinning}
                            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300 ${isSpinning
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-white text-black hover:bg-neon-green hover:shadow-[0_0_30px_#00ff9d] hover:scale-105 active:scale-95'
                                }`}
                        >
                            <Play fill="currentColor" size={20} />
                            {isSpinning ? 'SPINNING...' : 'PLACE BET'}
                        </button>
                    </div>
                </div>

                {/* Win Notification */}
                <AnimatePresence>
                    {hasWon && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
                        >
                            <div className="text-center">
                                <motion.h2
                                    animate={{ y: [0, -20, 0], scale: [1, 1.2, 1] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="text-7xl font-black text-neon-green italic drop-shadow-[0_0_30px_#00ff9d]"
                                >
                                    BIG WIN!
                                </motion.h2>
                                <p className="text-2xl font-bold text-white mt-2 drop-shadow-lg">+$250.00</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Side Actions */}
            <div className="absolute right-[-20px] top-1/2 -translate-y-1/2 flex flex-col gap-4 opacity-0 group-hover:opacity-100 group-hover:right-6 transition-all duration-500 z-40">
                <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-110 transition-all">
                    <Info size={20} />
                </button>
                <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 hover:scale-110 transition-all">
                    <Share2 size={20} />
                </button>
            </div>
        </div>
    );
};

export default AntigravityPanel;
