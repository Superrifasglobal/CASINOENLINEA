import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useSphere, useCylinder, useContactMaterial } from '@react-three/cannon';
import { OrbitControls, PerspectiveCamera, Text, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';
import RouletteBoard from './RouletteBoard';

// European Roulette Sequence
const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// Helper to calculate payout
const calculatePayout = (winNum, bets) => {
    let payout = 0;
    const winNumStr = winNum.toString();

    Object.entries(bets).forEach(([betId, amount]) => {
        // Individual numbers
        if (betId === winNumStr) {
            payout += amount * 36;
        }
        // Dozens
        else if (betId === 'dozen_1' && winNum >= 1 && winNum <= 12) payout += amount * 3;
        else if (betId === 'dozen_2' && winNum >= 13 && winNum <= 24) payout += amount * 3;
        else if (betId === 'dozen_3' && winNum >= 25 && winNum <= 36) payout += amount * 3;
        // Columns
        else if (betId === 'column_1' && winNum % 3 === 1) payout += amount * 3;
        else if (betId === 'column_2' && winNum % 3 === 2) payout += amount * 3;
        else if (betId === 'column_3' && winNum % 3 === 0 && winNum !== 0) payout += amount * 3;
        // Even/Odd
        else if (betId === 'even' && winNum !== 0 && winNum % 2 === 0) payout += amount * 2;
        else if (betId === 'odd' && winNum !== 0 && winNum % 2 !== 0) payout += amount * 2;
        // Colors
        else if (betId === 'red' && RED_NUMBERS.includes(winNum)) payout += amount * 2;
        else if (betId === 'black' && winNum !== 0 && !RED_NUMBERS.includes(winNum)) payout += amount * 2;
        // Low/High
        else if (betId === 'low' && winNum >= 1 && winNum <= 18) payout += amount * 2;
        else if (betId === 'high' && winNum >= 19 && winNum <= 36) payout += amount * 2;
    });

    return payout;
};

const Wheel = ({ spinning, angularVelocity }) => {
    const [ref, api] = useCylinder(() => ({
        mass: 0,
        type: 'Kinematic',
        args: [4, 4, 0.5, 37],
        position: [0, 0, 0],
    }));

    useFrame((state, delta) => {
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
                        <Text
                            position={[0, 0.1, 0]}
                            rotation={[-Math.PI / 2, 0, 0]}
                            fontSize={0.2}
                            color="white"
                        >
                            {num}
                        </Text>
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
    const [lastWin, setLastWin] = useState(null);

    const handleSpin = () => {
        if (totalBetValue <= 0) {
            setStatus("¡Coloca una apuesta primero!");
            return;
        }
        if (balance < totalBetValue) {
            setStatus("Saldo insuficiente");
            return;
        }

        const randomSpeed = Math.floor(Math.random() * 1000) + 1000;
        setAngularVelocity(randomSpeed);
        setSpinning(true);
        setLaunchRequested(prev => prev + 1);
        setStatus("Girando...");
        setLastWin(null);

        setTimeout(() => {
            setSpinning(false);
            const winNum = ROULETTE_SEQUENCE[Math.floor(Math.random() * 37)];
            const payout = calculatePayout(winNum, currentBets);

            setLastWin({ number: winNum, payout: payout });
            setStatus(`Resultado: ${winNum} ${payout > 0 ? `| GANASTE: $${payout}` : '| Sigue intentando'}`);
        }, 5000);
    };

    return (
        <div className="flex flex-col gap-8 pb-12">
            <div className="relative w-full h-[500px] bg-black/50 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <Canvas shadows>
                    <PerspectiveCamera makeDefault position={[0, 8, 8]} fov={45} />
                    <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 2.5} />

                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
                    <pointLight position={[-10, 10, -10]} intensity={0.5} />

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

                {/* Status Overlay */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                    <div className="glass-panel px-8 py-3 rounded-full border border-white/20 bg-black/60 shadow-xl backdrop-blur-md">
                        <span className={`font-black tracking-widest uppercase transition-colors duration-500 ${status.includes('GANASTE') ? 'text-neon-green' : 'text-neon-cyan'}`}>
                            {status}
                        </span>
                    </div>
                </div>

                {/* Spin Button */}
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
