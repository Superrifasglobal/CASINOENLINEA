import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Star, Zap } from 'lucide-react';

const RANKS = [
    { label: 'Polvo Espacial', minXP: 0, color: '#94a3b8' },
    { label: 'Satélite', minXP: 1000, color: '#38bdf8' },
    { label: 'Planeta', minXP: 5000, color: '#4ade80' },
    { label: 'Estrella', minXP: 20000, color: '#fbbf24' },
    { label: 'Agujero Negro', minXP: 100000, color: '#a855f7' }
];

const XPProgressBar = ({ currentXP = 0, level = 1 }) => {
    const currentRank = useMemo(() => {
        let r = RANKS[0];
        for (const rank of RANKS) {
            if (currentXP >= rank.minXP) r = rank;
            else break;
        }
        return r;
    }, [currentXP]);

    const nextRank = useMemo(() => {
        return RANKS.find(r => r.minXP > currentXP) || null;
    }, [currentXP]);

    const progress = useMemo(() => {
        if (!nextRank) return 100;
        const range = nextRank.minXP - currentRank.minXP;
        const relativeXP = currentXP - currentRank.minXP;
        return (relativeXP / range) * 100;
    }, [currentXP, currentRank, nextRank]);

    const isNearLevelUp = progress > 90;

    return (
        <div className="flex flex-col gap-2 w-full p-4 glass-panel border border-white/10 rounded-2xl bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden relative group">
            {/* Background Glow */}
            <AnimatePresence>
                {isNearLevelUp && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{
                            opacity: 0.15,
                            x: ['-100%', '100%']
                        }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                        style={{ filter: 'blur(40px)' }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'linear',
                        }}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-center justify-between gap-4 relative z-10">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Rango Actual</span>
                        <motion.div
                            animate={isNearLevelUp ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="p-1 rounded-md bg-white/5 border border-white/10"
                        >
                            <Rocket size={12} style={{ color: currentRank.color }} />
                        </motion.div>
                    </div>
                    <span className="text-sm font-black text-white group-hover:tracking-wider transition-all duration-500">
                        {currentRank.label}
                    </span>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Nivel Espacial</span>
                    <span className="text-lg font-black bg-gradient-to-br from-white to-gray-500 bg-clip-text text-transparent">
                        {level}
                    </span>
                </div>
            </div>

            {/* Progress Bar Container */}
            <div className="relative h-3 w-full bg-white/5 rounded-full border border-white/5 overflow-hidden">
                <motion.div
                    className="absolute inset-y-0 left-0 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    style={{
                        background: `linear-gradient(90deg, ${currentRank.color} 0%, white 100%)`,
                        boxShadow: isNearLevelUp ? `0 0 20px ${currentRank.color}99` : 'none'
                    }}
                />

                {/* Pulse Effect when near level up */}
                {isNearLevelUp && (
                    <motion.div
                        className="absolute inset-0 bg-white/20"
                        animate={{ opacity: [0, 0.5, 0] }}
                        transition={{ repeat: Infinity, duration: 0.8 }}
                    />
                )}
            </div>

            <div className="flex justify-between items-center relative z-10">
                <span className="text-[9px] font-bold text-gray-500 font-mono">
                    {currentXP.toLocaleString()} XP
                </span>
                {nextRank && (
                    <div className="flex items-center gap-1.5">
                        <Star size={10} className="text-yellow-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                            Próximo: {nextRank.label} ({nextRank.minXP.toLocaleString()} XP)
                        </span>
                    </div>
                )}
            </div>

            {/* Micro-Interaction Shine */}
            <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:animate-shine" />
        </div>
    );
};

export default XPProgressBar;
