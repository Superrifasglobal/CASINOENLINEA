import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useSphere, useCylinder } from '@react-three/cannon';
import { OrbitControls, PerspectiveCamera, Text, Environment, Trail, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import RouletteBoard from './RouletteBoard';

const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// PBR Materials
const goldMaterial = <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />;
const mahoganyMaterial = <meshStandardMaterial color="#4e1a0d" metalness={0.2} roughness={0.4} />;
const marbleMaterial = <meshStandardMaterial color="#e0e0e0" metalness={0.1} roughness={0.1} />;

const Wheel = ({ spinning, angularVelocity }) => {
    const [ref, api] = useCylinder(() => ({
        mass: 0,
        type: 'Kinematic',
        args: [4, 4, 0.5, 37],
        position: [0, 0, 0],
    }));

    useFrame(() => {
        if (spinning) {
            api.angularVelocity.set(0, THREE.MathUtils.degToRad(angularVelocity), 0);
        } else {
            api.angularVelocity.set(0, 0, 0);
        }
    });

    return (
        <group ref={ref}>
            {/* Main Wheel Body - Mahogany */}
            <mesh receiveShadow castShadow>
                <cylinderGeometry args={[4, 4, 0.5, 64]} />
                <meshStandardMaterial color="#4e1a0d" metalness={0.2} roughness={0.3} />
            </mesh>

            {/* Inner Ring - Gold */}
            <mesh position={[0, 0.26, 0]}>
                <cylinderGeometry args={[3.2, 3.2, 0.05, 64]} />
                {goldMaterial}
            </mesh>

            {/* Numbers and Sectors Overlay */}
            {ROULETTE_SEQUENCE.map((num, i) => {
                const angle = (i / 37) * Math.PI * 2;
                const x = Math.sin(angle) * 3.5;
                const z = Math.cos(angle) * 3.5;
                const color = num === 0 ? "#00ff00" : (RED_NUMBERS.includes(num) ? "#ff0000" : "#000000");
                return (
                    <group key={i} position={[x, 0.26, z]} rotation={[0, angle, 0]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[0.6, 0.05, 0.8]} />
                            <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
                        </mesh>
                        <Text position={[0, 0.1, 0.1]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="white" font="https://fonts.gstatic.com/s/robotomonospaced/v9/L0x5DF4xlVMF-BfR8bXMIJhLq38.woff">{num}</Text>
                    </group>
                );
            })}

            {/* Center Hub - Gold */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.5, 0.8, 0.8, 32]} />
                {goldMaterial}
            </mesh>

            {/* Deflectors (Rombos) - Gold */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
                const angle = (i / 8) * Math.PI * 2;
                const x = Math.sin(angle) * 2.8;
                const z = Math.cos(angle) * 2.8;
                return (
                    <mesh key={i} position={[x, 0.35, z]} rotation={[0, angle, 0]}>
                        <boxGeometry args={[0.15, 0.2, 0.15]} />
                        {goldMaterial}
                    </mesh>
                );
            })}
        </group>
    );
};

const Ball = ({ launchRequested, onCollision }) => {
    const [ref, api] = useSphere(() => ({
        mass: 0.05,
        args: [0.12],
        position: [3.8, 1, 0],
        linearDamping: 0.2,
        angularDamping: 0.2,
        onCollide: (e) => {
            if (onCollision) onCollision(e);
        }
    }));

    useEffect(() => {
        if (launchRequested) {
            api.position.set(3.8, 1, 0);
            api.velocity.set(0, 0, 0);
            api.applyImpulse([0, 0, 14], [0, 0, 0]);
        }
    }, [launchRequested, api]);

    return (
        <group>
            <mesh ref={ref} castShadow>
                <sphereGeometry args={[0.12, 32, 32]} />
                <meshStandardMaterial color="white" metalness={0.9} roughness={0.05} />
                <Trail
                    width={1.5}
                    length={8}
                    color={new THREE.Color('#00ffff')}
                    attenuation={(t) => t * t}
                >
                    <meshBasicMaterial transparent opacity={0.3} />
                </Trail>
            </mesh>
        </group>
    );
};

const CinematicCamera = ({ state, targetPos }) => {
    const { camera } = useThree();
    const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

    useFrame((_, delta) => {
        let desiredPos = new THREE.Vector3(0, 8, 8);
        let lookAtPos = new THREE.Vector3(0, 0, 0);

        if (state === 'spinning') {
            desiredPos.set(0, 6, 10);
            lookAtPos.set(0, 0, 0);
        } else if (state === 'result' && targetPos) {
            desiredPos.copy(targetPos).add(new THREE.Vector3(0, 2, 2));
            lookAtPos.copy(targetPos);
        } else {
            // Orbit/Idle
            const time = Date.now() * 0.0005;
            desiredPos.set(Math.sin(time) * 10, 8, Math.cos(time) * 10);
        }

        camera.position.lerp(desiredPos, delta * 3);
        currentTarget.current.lerp(lookAtPos, delta * 3);
        camera.lookAt(currentTarget.current);
    });

    return null;
};

const Roulette3D = ({ user, balance, onBalanceUpdate }) => {
    const [gameState, setGameState] = useState('idle'); // idle, spinning, result
    const [angularVelocity, setAngularVelocity] = useState(0);
    const [launchRequested, setLaunchRequested] = useState(0);
    const [status, setStatus] = useState("Esperando apuestas...");
    const [currentBets, setCurrentBets] = useState({});
    const [totalBetValue, setTotalBetValue] = useState(0);
    const [winData, setWinData] = useState(null);
    const [showSparks, setShowSparks] = useState(false);

    const handleSpin = async () => {
        if (totalBetValue <= 0) return setStatus("¡Coloca una apuesta primero!");
        if (balance < totalBetValue) return setStatus("Saldo insuficiente");

        setStatus("Iniciando partida segura...");
        setGameState('spinning');

        try {
            const response = await fetch('/api/roulette/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, bets: currentBets, totalBet: totalBetValue })
            });

            const data = await response.json();
            if (data.server_result !== undefined) {
                setWinData(data);
                const randomSpeed = Math.floor(Math.random() * 1000) + 1200;
                setAngularVelocity(randomSpeed);
                setLaunchRequested(prev => prev + 1);
                setStatus("Girando...");

                setTimeout(() => {
                    setGameState('result');
                    const payout = data.user_balance - (balance - totalBetValue);
                    setStatus(`Resultado: ${data.server_result} ${payout > 0 ? `| GANASTE: $${payout.toFixed(2)}` : '| Sigue intentando'}`);
                    if (onBalanceUpdate) onBalanceUpdate();
                }, 6000);
            } else {
                throw new Error("Invalid server response");
            }

        } catch (error) {
            console.error('Spin Error:', error);
            setStatus(`Error: ${error.message}`);
            setGameState('idle');
        }
    };

    const handleCollision = () => {
        setShowSparks(true);
        setTimeout(() => setShowSparks(false), 200);
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="relative w-full h-[600px] bg-[#050505] rounded-[3rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                <Canvas shadows gl={{ antialias: true }}>
                    <CinematicCamera state={gameState} />

                    <ambientLight intensity={0.4} />
                    <pointLight position={[5, 10, 5]} intensity={2} castShadow color="#ffffff" />
                    <spotLight position={[-5, 10, -5]} intensity={1} angle={0.3} penumbra={1} castShadow color="#ffd700" />

                    <Suspense fallback={null}>
                        <Physics gravity={[0, -9.81, 0]}>
                            <Wheel spinning={gameState === 'spinning'} angularVelocity={angularVelocity} />
                            <Ball
                                launchRequested={launchRequested}
                                onCollision={handleCollision}
                            />

                            {/* Table Surface - Marble */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
                                <circleGeometry args={[10, 64]} />
                                <meshStandardMaterial color="#222" metalness={0.1} roughness={0.05} />
                            </mesh>

                            {/* Spacing Track - Ebony */}
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
                                <ringGeometry args={[4, 5, 64]} />
                                <meshStandardMaterial color="#050505" metalness={0.5} roughness={0.1} />
                            </mesh>
                        </Physics>

                        {showSparks && (
                            <Float speed={5} rotationIntensity={2} floatIntensity={2}>
                                <Sparkles count={50} scale={2} size={6} speed={0.4} opacity={1} color="#ffd700" />
                            </Float>
                        )}
                    </Suspense>
                    <Environment preset="studio" />
                </Canvas>

                {/* Status Overlay */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2">
                    <div className="glass-panel px-10 py-4 rounded-full border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl">
                        <span className={`font-black tracking-[0.2em] uppercase text-xl transition-all duration-500 ${status.includes('GANASTE') ? 'text-neon-green drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'text-white'}`}>
                            {status}
                        </span>
                    </div>
                </div>

                {/* Spin UI Customization */}
                {gameState !== 'spinning' && (
                    <div className="absolute bottom-12 right-12 z-20">
                        <button
                            onClick={handleSpin}
                            className="group relative overflow-hidden bg-white text-black px-16 py-6 rounded-3xl font-black text-2xl hover:scale-105 transition-all shadow-[0_20px_40px_rgba(0,0,0,0.4)] active:scale-95"
                        >
                            <span className="relative z-10 uppercase tracking-widest">Girar ahora</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-neon-green to-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </button>
                    </div>
                )}
            </div>

            <RouletteBoard
                totalBalance={balance}
                onBetsChange={(bets, total) => {
                    setCurrentBets(bets);
                    setTotalBetValue(total);
                }}
                gameStatus={gameState === 'spinning' ? 'spinning' : 'idle'}
            />
        </div>
    );
};

export default Roulette3D;
