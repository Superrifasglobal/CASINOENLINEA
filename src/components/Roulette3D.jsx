import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useSphere, useCylinder } from '@react-three/cannon';
import { OrbitControls, PerspectiveCamera, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import RouletteBoard from './RouletteBoard';

const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

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
            <mesh receiveShadow castShadow>
                <cylinderGeometry args={[4, 4, 0.5, 64]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>
            {ROULETTE_SEQUENCE.map((num, i) => {
                const angle = (i / 37) * Math.PI * 2;
                const x = Math.sin(angle) * 3.5;
                const z = Math.cos(angle) * 3.5;
                const color = num === 0 ? "#00ff00" : (RED_NUMBERS.includes(num) ? "#ff0000" : "#000000");
                return (
                    <group key={i} position={[x, 0.26, z]} rotation={[0, angle, 0]}>
                        <mesh receiveShadow>
                            <boxGeometry args={[0.6, 0.05, 0.8]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                        <Text position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="white">{num}</Text>
                    </group>
                );
            })}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.5, 0.8, 0.6, 32]} />
                <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
            </mesh>
        </group>
    );
};

const Ball = ({ launchRequested }) => {
    const [ref, api] = useSphere(() => ({
        mass: 0.05,
        args: [0.12],
        position: [3.8, 1, 0],
        linearDamping: 0.1,
        angularDamping: 0.1,
    }));

    useEffect(() => {
        if (launchRequested) {
            api.position.set(3.8, 1, 0);
            api.velocity.set(0, 0, 0);
            api.applyImpulse([0, 0, 15], [0, 0, 0]);
        }
    }, [launchRequested, api]);

    return (
        <mesh ref={ref} castShadow>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial color="white" metalness={1} roughness={0} />
        </mesh>
    );
};

const Roulette3D = ({ user, balance, onBalanceUpdate }) => {
    const [spinning, setSpinning] = useState(false);
    const [angularVelocity, setAngularVelocity] = useState(0);
    const [launchRequested, setLaunchRequested] = useState(0);
    const [status, setStatus] = useState("Esperando apuestas...");
    const [currentBets, setCurrentBets] = useState({});
    const [totalBetValue, setTotalBetValue] = useState(0);

    const handleSpin = async () => {
        if (totalBetValue <= 0) {
            setStatus("¡Coloca una apuesta primero!");
            return;
        }
        if (balance < totalBetValue) {
            setStatus("Saldo insuficiente");
            return;
        }

        setStatus("Iniciando partida segura...");
        setSpinning(true);

        try {
            // Server-Side Truth: Fetch result before animation
            const response = await fetch('/api/roulette/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, bets: currentBets, totalBet: totalBetValue })
            });

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            // Start visual animation based on backend data
            const randomSpeed = Math.floor(Math.random() * 1000) + 1000;
            setAngularVelocity(randomSpeed);
            setLaunchRequested(prev => prev + 1);
            setStatus("Girando...");

            setTimeout(() => {
                setSpinning(false);
                setStatus(`Resultado: ${data.winningNumber} ${data.payout > 0 ? `| GANASTE: $${data.payout}` : '| Sigue intentando'}`);
                if (onBalanceUpdate) onBalanceUpdate(); // Sync balance with DB
            }, 5000);

        } catch (error) {
            console.error('Spin Error:', error);
            setStatus(`Error: ${error.message}`);
            setSpinning(false);
        }
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="relative w-full h-[500px] bg-black/50 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <Canvas shadows>
                    <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={45} />
                    <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.5} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
                    <Suspense fallback={null}>
                        <Physics gravity={[0, -9.81, 0]}>
                            <Wheel spinning={spinning} angularVelocity={angularVelocity} />
                            <Ball launchRequested={launchRequested} />
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
                                <circleGeometry args={[5, 64]} />
                                <meshStandardMaterial color="#0a0a0a" />
                            </mesh>
                        </Physics>
                    </Suspense>
                    <Environment preset="city" />
                </Canvas>

                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                    <div className="glass-panel px-8 py-3 rounded-full border border-white/20 bg-black/60 shadow-xl backdrop-blur-md">
                        <span className={`font-black tracking-widest uppercase transition-colors duration-500 ${status.includes('GANASTE') ? 'text-neon-green' : 'text-neon-cyan'}`}>
                            {status}
                        </span>
                    </div>
                </div>

                {!spinning && (
                    <div className="absolute bottom-8 right-8">
                        <button
                            onClick={handleSpin}
                            className="bg-white text-black px-12 py-5 rounded-2xl font-black text-2xl hover:bg-neon-green hover:scale-105 transition-all shadow-2xl active:scale-95"
                        >
                            GIRAR
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
                gameStatus={spinning ? 'spinning' : 'idle'}
            />
        </div>
    );
};

export default Roulette3D;
