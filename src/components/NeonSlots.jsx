import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCw } from 'lucide-react';

const SYMBOLS = ['🍇', '🍊', '🍒', '💎', '7️⃣', '🔔'];

const NeonSlots = ({ user, balance, onBalanceUpdate, onBack }) => {
    const [reels, setReels] = useState(['7️⃣', '7️⃣', '7️⃣']);
    const [isSpinning, setIsSpinning] = useState(false);
    const [win, setWin] = useState(0);

    const spin = async () => {
        if (balance < 5 || isSpinning) return;
        setIsSpinning(true);
        setWin(0);

        // Simulate network/RNG delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Randomize
        const newReels = reels.map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
        setReels(newReels);

        // Simple win logic (all 3 match)
        if (newReels[0] === newReels[1] && newReels[1] === newReels[2]) {
            const winAmount = 100;
            setWin(winAmount);
            // Here you would call backend to update balance
        }

        setIsSpinning(false);
        onBalanceUpdate(); // Refresh balance (in a real app this would sync with DB)
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-8">
            <button
                onClick={onBack}
                className="self-start text-xs font-bold text-gray-500 hover:text-white mb-4 uppercase tracking-widest"
            >
                ← Volver al Lobby
            </button>

            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-purple-500 italic">
                NEON SLOTS
            </h1>

            <div className="flex gap-4 p-8 bg-black/50 border border-neon-pink/30 rounded-3xl shadow-[0_0_50px_rgba(255,0,127,0.2)]">
                {reels.map((symbol, i) => (
                    <div key={i} className="w-24 h-32 flex items-center justify-center bg-gray-900 border border-white/10 rounded-xl text-5xl">
                        <motion.div
                            key={isSpinning ? `spin-${i}` : `static-${i}`}
                            animate={isSpinning ? { y: [0, -100, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 0.2, delay: i * 0.1 }}
                        >
                            {symbol}
                        </motion.div>
                    </div>
                ))}
            </div>

            {win > 0 && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-3xl font-bold text-neon-green shadow-black drop-shadow-lg"
                >
                    ¡GANASTE ${win}!
                </motion.div>
            )}

            <button
                onClick={spin}
                disabled={isSpinning || balance < 5}
                className={`flex items-center gap-3 px-12 py-4 rounded-full font-bold text-xl transition-all ${isSpinning ? 'bg-gray-700 text-gray-500' : 'bg-neon-pink text-white hover:shadow-[0_0_30px_#ff007f] hover:scale-105'
                    }`}
            >
                {isSpinning ? <RotateCw className="animate-spin" /> : <Play fill="currentColor" />}
                {isSpinning ? 'GIRANDO...' : 'GIRAR ($5)'}
            </button>
        </div>
    );
};

export default NeonSlots;
