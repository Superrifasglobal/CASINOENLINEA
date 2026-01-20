import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars, Float, Text, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion-3d';
import { Zap, RotateCcw, Play, Hand, ShieldAlert } from 'lucide-react';

// Crystal Card Component
const CrystalCard = ({ position, card, index }) => {
    const meshRef = useRef();

    // Smooth floating animation
    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime + index) * 0.002;
        meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + index) * 0.1;
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={meshRef} position={position}>
                <boxGeometry args={[0.7, 1, 0.05]} />
                <MeshDistortMaterial
                    color={card.suit === 'hearts' || card.suit === 'diamonds' ? '#ff3e3e' : '#3e3eff'}
                    speed={2}
                    distort={0.1}
                    radius={1}
                    transparent
                    opacity={0.7}
                    roughness={0}
                    metalness={0.5}
                />
                <Text
                    position={[0, 0, 0.03]}
                    fontSize={0.2}
                    color="white"
                    font="https://fonts.gstatic.com/s/robotomono/v12/L0tkDFwvuaCwsi_K0rtoMTp8f6TC.woff"
                >
                    {card.value}
                </Text>
            </mesh>
        </Float>
    );
};

const BlackjackGame = () => {
    const [gameState, setGameState] = useState(null);
    const [bet, setBet] = useState(10);
    const [loading, setLoading] = useState(false);

    const startGame = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/blackjack/start', {
                method: 'POST',
                body: JSON.stringify({ bet })
            });
            const data = await res.json();
            setGameState(data.state);
        } finally {
            setLoading(false);
        }
    };

    const hit = async () => {
        if (!gameState) return;
        const res = await fetch('/api/blackjack/hit', { method: 'POST' });
        const data = await res.json();
        setGameState(data.state);
    };

    const stand = async () => {
        if (!gameState) return;
        const res = await fetch('/api/blackjack/stand', { method: 'POST' });
        const data = await res.json();
        setGameState(data.state);
    };

    return (
        <div className="w-full h-[600px] relative bg-black rounded-3xl overflow-hidden border border-white/10 group">
            {/* 3D Scene */}
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[0, 4, 8]} fov={50} />
                <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2.1} />

                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} color="#00f2ff" />
                <pointLight position={[-10, 5, 5]} intensity={0.5} color="#ff00ff" />

                {/* Game Area */}
                <Suspense fallback={null}>
                    {gameState && (
                        <>
                            {/* Dealer Hand */}
                            {gameState.dealerHand.map((card, i) => (
                                <CrystalCard
                                    key={`dealer-${i}`}
                                    position={[i * 0.8 - (gameState.dealerHand.length - 1) * 0.4, 2, 0]}
                                    card={card}
                                    index={i}
                                />
                            ))}

                            {/* Player Hand */}
                            {gameState.playerHand.map((card, i) => (
                                <CrystalCard
                                    key={`player-${i}`}
                                    position={[i * 0.8 - (gameState.playerHand.length - 1) * 0.4, -0.5, 2]}
                                    card={card}
                                    index={i}
                                />
                            ))}
                        </>
                    )}
                </Suspense>
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute inset-x-0 bottom-0 p-8 flex flex-col items-center gap-6 pointer-events-none">
                {!gameState ? (
                    <div className="flex flex-col items-center gap-4 pointer-events-auto">
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 p-2 rounded-2xl">
                            {[10, 50, 100].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setBet(val)}
                                    className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${bet === val ? 'bg-neon-blue text-white shadow-lg' : 'text-gray-400 hover:bg-white/5'}`}
                                >
                                    {val} ETH
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={startGame}
                            disabled={loading}
                            className="bg-white text-black font-black py-4 px-12 rounded-2xl text-lg hover:scale-105 transition-all shadow-2xl flex items-center gap-3"
                        >
                            <Play size={20} fill="currentColor" /> INICIAR PARTIDA
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-6 w-full max-w-lg pointer-events-auto">
                        {/* Status Label */}
                        <div className={`px-6 py-2 rounded-full border text-[10px] font-black tracking-[0.2em] uppercase ${gameState.status === 'playing' ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' :
                                gameState.status === 'player_win' || gameState.status === 'blackjack' ? 'bg-green-500/10 border-green-500/50 text-green-400 animate-pulse' :
                                    'bg-red-500/10 border-red-500/50 text-red-400'
                            }`}>
                            {gameState.status.replace('_', ' ')}
                        </div>

                        <div className="flex items-center gap-4 w-full">
                            <button
                                onClick={hit}
                                disabled={gameState.status !== 'playing'}
                                className="flex-1 bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all disabled:opacity-20"
                            >
                                <Zap size={18} /> PEDIR CARTA
                            </button>
                            <button
                                onClick={stand}
                                disabled={gameState.status !== 'playing'}
                                className="flex-1 bg-white text-black font-black py-4 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-all disabled:opacity-20"
                            >
                                <Hand size={18} /> QUEDARME
                            </button>
                        </div>

                        {gameState.status !== 'playing' && (
                            <button
                                onClick={() => setGameState(null)}
                                className="text-gray-500 hover:text-white flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                                <RotateCcw size={12} /> JUGAR DE NUEVO
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Title */}
            <div className="absolute top-8 left-8">
                <h2 className="text-2xl font-black italic tracking-tighter text-white/50 flex items-center gap-3">
                    <ShieldAlert size={20} className="text-neon-blue" /> ZERO-G BLACKJACK
                </h2>
            </div>
        </div>
    );
};

export default BlackjackGame;
