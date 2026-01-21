import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bomb, Gem, Coins, Shield, Play, RotateCcw, AlertTriangle } from 'lucide-react';

const MinesGame = ({ user, balance, onBalanceUpdate, onBack }) => {
    const [bet, setBet] = useState(10);
    const [mineCount, setMineCount] = useState(3);
    const [gameState, setGameState] = useState(null); // { revealed: [], multiplier: 1, status: 'playing' }
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const startGame = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/mines/start?userId=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bet, mineCount })
            });
            const data = await res.json();
            if (res.ok) {
                setGameState(data.state);
                onBalanceUpdate();
            } else {
                setError(data.message || 'Error al iniciar');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const revealCell = async (index) => {
        if (!gameState || gameState.status !== 'playing' || gameState.revealed.includes(index) || loading) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/mines/reveal?userId=${user.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ index })
            });
            const data = await res.json();
            if (res.ok) {
                setGameState(data.state);
                if (data.state.status !== 'playing') onBalanceUpdate();
            }
        } finally {
            setLoading(false);
        }
    };

    const cashout = async () => {
        if (!gameState || gameState.status !== 'playing' || gameState.revealed.length === 0 || loading) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/mines/cashout?userId=${user.id}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (res.ok) {
                setGameState(data.state);
                onBalanceUpdate();
            }
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setGameState(null);
        setError(null);
    };

    return (
        <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto p-4">
            <div className="w-full flex justify-between items-center">
                <button onClick={onBack} className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    ← Volver
                </button>
                <h2 className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple uppercase tracking-tighter">
                    Gravity Mines
                </h2>
                <div className="w-20" /> {/* Spacer */}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 w-full">
                {/* Control Panel */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-6 backdrop-blur-xl">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Monto de Apuesta</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={bet}
                                onChange={(e) => setBet(Number(e.target.value))}
                                disabled={gameState?.status === 'playing'}
                                className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-lg font-black italic text-white focus:outline-none focus:border-neon-blue/50 transition-colors"
                            />
                            <Coins className="absolute right-5 top-1/2 -translate-y-1/2 text-neon-blue/50" size={20} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Minas: {mineCount}</label>
                        <input
                            type="range"
                            min="1"
                            max="24"
                            value={mineCount}
                            onChange={(e) => setMineCount(Number(e.target.value))}
                            disabled={gameState?.status === 'playing'}
                            className="w-full accent-neon-purple h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-1">
                            <span>1 Mina</span>
                            <span>24 Minas</span>
                        </div>
                    </div>

                    {!gameState || gameState.status !== 'playing' ? (
                        <button
                            onClick={startGame}
                            disabled={loading || !user}
                            className="w-full py-5 bg-white text-black font-black italic uppercase rounded-2xl hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50"
                        >
                            {loading ? 'Iniciando...' : 'Jugar Ahora'}
                        </button>
                    ) : (
                        <button
                            onClick={cashout}
                            disabled={loading || gameState.revealed.length === 0}
                            className="w-full py-5 bg-neon-green text-black font-black italic uppercase rounded-2xl hover:scale-[1.02] transition-all shadow-xl disabled:opacity-30"
                        >
                            Retirar ${(gameState.bet * gameState.multiplier).toFixed(2)}
                        </button>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase text-center flex items-center gap-2 justify-center">
                            <AlertTriangle size={12} /> {error}
                        </div>
                    )}
                </div>

                {/* Game Grid */}
                <div className="relative aspect-square max-w-[500px] w-full bg-black/40 border border-white/10 rounded-[2.5rem] p-6 grid grid-cols-5 gap-3">
                    {Array.from({ length: 25 }).map((_, i) => {
                        const isRevealed = gameState?.revealed.includes(i);
                        const isExploded = gameState?.status === 'loss' && gameState.grid[i];
                        const isGem = gameState?.status !== 'playing' && !gameState?.grid[i] && isRevealed;
                        const isHiddenMine = gameState?.status === 'loss' && gameState.grid[i];
                        const isHiddenGem = gameState?.status === 'loss' && !gameState.grid[i] && !isRevealed;

                        return (
                            <motion.button
                                key={i}
                                whileHover={!isRevealed && gameState?.status === 'playing' ? { scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' } : {}}
                                whileTap={!isRevealed && gameState?.status === 'playing' ? { scale: 0.95 } : {}}
                                onClick={() => revealCell(i)}
                                disabled={isRevealed || gameState?.status !== 'playing' || loading}
                                className={`
                                    relative rounded-xl border flex items-center justify-center transition-all duration-300 overflow-hidden
                                    ${isRevealed ? 'bg-black/60 border-white/10' : 'bg-white/5 border-white/5 cursor-pointer'}
                                    ${isExploded ? 'bg-red-500/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : ''}
                                    ${isGem ? 'bg-neon-green/10 border-neon-green/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : ''}
                                    ${isHiddenGem ? 'opacity-20' : ''}
                                `}
                            >
                                <AnimatePresence mode="wait">
                                    {isRevealed && !gameState.grid[i] && (
                                        <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} key="gem">
                                            <Gem className="text-neon-green drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]" size={32} fill="currentColor" />
                                        </motion.div>
                                    )}
                                    {isExploded && (
                                        <motion.div initial={{ scale: 0, rotate: 45 }} animate={{ scale: 1, rotate: 0 }} key="bomb">
                                            <Bomb className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" size={32} fill="currentColor" />
                                        </motion.div>
                                    )}
                                    {gameState?.status === 'loss' && gameState.grid[i] && !isExploded && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.3 }} key="hidden-bomb">
                                            <Bomb className="text-gray-500" size={32} />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Overlay for unrevealed */}
                                {!isRevealed && gameState?.status === 'playing' && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                                )}
                            </motion.button>
                        );
                    })}

                    {/* Game Over UI Overlay */}
                    {gameState?.status && gameState.status !== 'playing' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
                        >
                            <div className={`p-8 rounded-[2rem] border backdrop-blur-2xl shadow-2xl pointer-events-auto flex flex-col items-center gap-4 ${gameState.status === 'win' ? 'bg-neon-green/10 border-neon-green/50' : 'bg-red-500/10 border-red-500/50'}`}>
                                <h3 className={`text-3xl font-black italic uppercase tracking-tighter ${gameState.status === 'win' ? 'text-neon-green' : 'text-red-500'}`}>
                                    {gameState.status === 'win' ? '¡GANASTE!' : 'HAS PERDIDO'}
                                </h3>
                                {gameState.status === 'win' && (
                                    <span className="text-4xl font-black text-white italic tracking-widest leading-none">
                                        ${(gameState.bet * gameState.multiplier).toFixed(2)}
                                    </span>
                                )}
                                <button
                                    onClick={reset}
                                    className="mt-2 py-3 px-8 bg-white text-black font-black uppercase text-xs rounded-xl hover:scale-105 transition-all"
                                >
                                    Jugar de Nuevo
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Info Section */}
            <div className="w-full max-w-lg flex flex-col items-center gap-4">
                <div className="flex gap-2 w-full">
                    <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Multiplicador Actual</span>
                        <span className="text-xl font-black text-neon-blue italic">{gameState?.multiplier.toFixed(2) || '1.00'}x</span>
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col items-center">
                        <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Gemas Encontradas</span>
                        <span className="text-xl font-black text-neon-green italic">{gameState?.revealed.length || '0'} / {25 - mineCount}</span>
                    </div>
                </div>
                <p className="text-[9px] text-gray-600 uppercase font-medium tracking-[0.2em] flex items-center gap-2">
                    <Shield size={10} /> Sistema Provably Fair • 95% RTP
                </p>
            </div>
        </div>
    );
};

export default MinesGame;
