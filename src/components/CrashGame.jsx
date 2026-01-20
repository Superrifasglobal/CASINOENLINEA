import React, { useState, useEffect, useRef } from 'react';
import { Rocket, TrendingUp, AlertTriangle, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CrashGame = ({ user, balance, onBalanceUpdate, onBack }) => {
    const [gameState, setGameState] = useState('IDLE'); // IDLE, BETTING, RUNNING, CRASHED
    const [multiplier, setMultiplier] = useState(1.00);
    const [betAmount, setBetAmount] = useState(10);
    const [cashedOut, setCashedOut] = useState(false);
    const [history, setHistory] = useState([1.5, 2.1, 1.1, 5.4, 1.0, 3.2]);

    // Canvas refs
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const startTimeRef = useRef(null);

    // Game constants
    const GROWTH_RATE = 0.00006; // Speed of curve

    useEffect(() => {
        if (gameState === 'RUNNING') {
            startTimeRef.current = Date.now();
            setMultiplier(1.00);
            setCashedOut(false);
            animateGraph();
        } else if (gameState === 'CRASHED') {
            cancelAnimationFrame(animationRef.current);
            setHistory(prev => [multiplier, ...prev].slice(0, 8));
        }

        return () => cancelAnimationFrame(animationRef.current);
    }, [gameState]);

    const animateGraph = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        const timeElapsed = Date.now() - startTimeRef.current;
        // Exponential growth formula: M(t) = e^(k * t)
        // Simplified for simulation and visual effect:
        const currentMult = 1 + (timeElapsed * timeElapsed * GROWTH_RATE) / 1000;

        // Random crash logic (simplified)
        // In real app, this is determined by server seed BEFORE game starts
        if (Math.random() < 0.005 + (currentMult * 0.0001)) {
            setGameState('CRASHED');
            setMultiplier(currentMult);
            return;
        }

        setMultiplier(currentMult);

        // Draw graph
        ctx.clearRect(0, 0, width, height);

        // Draw grid
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < width; i += 50) { ctx.moveTo(i, 0); ctx.lineTo(i, height); }
        for (let i = 0; i < height; i += 50) { ctx.moveTo(0, i); ctx.lineTo(width, i); }
        ctx.stroke();

        // Draw curve
        ctx.strokeStyle = '#00ff9d'; // Neon Green
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, height);

        // Calculate curve points based on time
        // We simulate the "zooming out" effect by mapping time to x and multiplier to y
        const x = Math.min(width, (timeElapsed / 5000) * width);
        const y = height - Math.min(height, ((currentMult - 1) / 5) * height);

        ctx.quadraticCurveTo(x / 2, height, x, y);
        ctx.stroke();

        // Draw glow under curve
        ctx.fillStyle = 'rgba(0, 255, 157, 0.1)';
        ctx.lineTo(x, height);
        ctx.lineTo(0, height);
        ctx.fill();

        // Draw rocket/point
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 15;

        animationRef.current = requestAnimationFrame(animateGraph);
    };

    const startGame = () => {
        if (balance < betAmount) {
            alert("Saldo insuficiente");
            return;
        }
        setGameState('BETTING');
        setTimeout(() => setGameState('RUNNING'), 1000); // 1s delay before launch
        // Deduct balance logic here
    };

    const cashOut = () => {
        if (gameState !== 'RUNNING' || cashedOut) return;
        setCashedOut(true);
        const winAmount = betAmount * multiplier;
        // Add balance logic here
        // alert(`Cashed out at ${multiplier.toFixed(2)}x! Won $${winAmount.toFixed(2)}`);
    };

    return (
        <div className="flex flex-col items-center w-full max-h-screen relative p-4 gap-4">
            {/* Header / Back */}
            <div className="w-full flex justify-between items-center z-10">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <TrendingUp className="rotate-180" size={16} /> Volver
                </button>
                <div className="flex gap-2">
                    {history.map((h, i) => (
                        <div key={i} className={`px-2 py-1 rounded-md text-xs font-mono font-bold ${h >= 2.0 ? 'text-neon-green bg-neon-green/10' : 'text-neon-pink bg-neon-pink/10'}`}>
                            {h.toFixed(2)}x
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl flex-1 min-h-[500px]">

                {/* Game Area (Graph) */}
                <div className="flex-1 bg-black/40 border border-white/5 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neon-purple/5 via-transparent to-transparent opacity-50 pointer-events-none" />

                    {/* Multiplier Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                        <div className="text-center">
                            <div className={`text-6xl md:text-8xl font-black font-mono tracking-tighter transition-colors duration-100 ${gameState === 'CRASHED' ? 'text-neon-pink' : 'text-white'}`}>
                                {multiplier.toFixed(2)}x
                            </div>
                            <div className="mt-2 text-sm font-bold uppercase tracking-[0.3em] text-gray-500">
                                {gameState === 'RUNNING' ? 'Vuelo en curso' : gameState === 'CRASHED' ? 'CRASHED' : 'Esperando despegue'}
                            </div>
                        </div>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={800}
                        height={500}
                        className="w-full h-full object-cover z-10"
                    />
                </div>

                {/* Controls Sidebar */}
                <div className="w-full md:w-80 glass-panel p-6 rounded-3xl flex flex-col gap-6">
                    <div className="flex items-center gap-2 mb-2">
                        <Rocket className="text-neon-purple" />
                        <h2 className="text-xl font-bold italic">CONTROL MANUAL</h2>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Apuesta (ETH)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white font-mono focus:outline-none focus:border-neon-purple/50"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <button onClick={() => setBetAmount(betAmount / 2)} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold">½</button>
                                <button onClick={() => setBetAmount(betAmount * 2)} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] font-bold">2x</button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto">
                        {gameState === 'IDLE' || gameState === 'CRASHED' ? (
                            <button
                                onClick={startGame}
                                className="w-full py-4 rounded-xl bg-neon-green text-black font-black text-lg hover:shadow-[0_0_20px_#00ff9d] hover:scale-[1.02] transition-all uppercase tracking-wider"
                            >
                                Jugar
                            </button>
                        ) : gameState === 'BETTING' ? (
                            <button disabled className="w-full py-4 rounded-xl bg-gray-600 text-white font-black text-lg opacity-50 cursor-not-allowed">
                                Iniciando...
                            </button>
                        ) : (
                            <button
                                onClick={cashOut}
                                disabled={cashedOut}
                                className={`w-full py-4 rounded-xl font-black text-lg hover:scale-[1.02] transition-all uppercase tracking-wider ${cashedOut ? 'bg-gray-700 text-gray-400' : 'bg-neon-pink text-white hover:shadow-[0_0_20px_#ff007f]'}`}
                            >
                                {cashedOut ? 'Cobrado' : 'RETIRAR'}
                            </button>
                        )}

                        {cashedOut && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-4 rounded-xl bg-neon-green/10 border border-neon-green/20 text-center"
                            >
                                <div className="text-xs text-neon-green font-bold uppercase tracking-widest">Beneficio</div>
                                <div className="text-xl font-mono text-white">+{(betAmount * (multiplier - 1)).toFixed(4)} ETH</div>
                            </motion.div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CrashGame;
