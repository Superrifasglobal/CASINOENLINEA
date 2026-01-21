import React, { useState, useRef, useEffect, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics, useSphere, useCylinder } from '@react-three/cannon';
import { OrbitControls, PerspectiveCamera, Text, Environment, Trail, Float, Sparkles, PositionalAudio } from '@react-three/drei';
import * as THREE from 'three';
import RouletteBoard from './RouletteBoard';

const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

// PBR Materials
const goldMaterial = <meshStandardMaterial color="#ffd700" metalness={1} roughness={0.1} />;
const mahoganyMaterial = <meshStandardMaterial color="#4e1a0d" metalness={0.2} roughness={0.4} />;

const Wheel = ({ spinning, angularVelocity, rotationValue }) => {
    const [ref, api] = useCylinder(() => ({
        mass: 0,
        type: 'Kinematic',
        args: [4, 4, 0.5, 37],
        position: [0, 0, 0],
    }));

    useFrame((state, delta) => {
        if (spinning) {
            const step = THREE.MathUtils.degToRad(angularVelocity) * delta;
            rotationValue.current += step;
            api.angularVelocity.set(0, THREE.MathUtils.degToRad(angularVelocity), 0);
        } else {
            api.angularVelocity.set(0, 0, 0);
        }
    });

    return (
        <group ref={ref}>
            <mesh receiveShadow castShadow>
                <cylinderGeometry args={[4, 4, 0.5, 64]} />
                <meshStandardMaterial color="#4e1a0d" metalness={0.2} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.26, 0]}>
                <cylinderGeometry args={[3.2, 3.2, 0.05, 64]} />
                {goldMaterial}
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
                            <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
                        </mesh>
                        <Text position={[0, 0.1, 0.1]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.2} color="white">{num}</Text>
                    </group>
                );
            })}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[0.5, 0.8, 0.8, 32]} />
                {goldMaterial}
            </mesh>
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

const Ball = ({ launchRequested, onCollision, targetNumber, rotationValue, gameState, onSettled }) => {
    const [isKinematic, setIsKinematic] = useState(false);
    const [ref, api] = useSphere(() => ({
        mass: 0.05,
        args: [0.12],
        position: [3.8, 1, 0],
        linearDamping: 0.2,
        angularDamping: 0.2,
        type: 'Dynamic',
        onCollide: (e) => {
            if (onCollision) onCollision(e);
        }
    }));

    const hitSound = useRef();
    const settledSound = useRef();

    useEffect(() => {
        if (launchRequested) {
            setIsKinematic(false);
            api.type.set('Dynamic');
            api.position.set(3.8, 1, 0);
            api.velocity.set(0, 0, 0);
            api.applyImpulse([0, 0, 14], [0, 0, 0]);
        }
    }, [launchRequested, api]);

    useFrame((state, delta) => {
        if (gameState === 'spinning' && !isKinematic) {
            const subscription = api.velocity.subscribe((v) => {
                const speed = Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2);
                if (speed < 1.0 && targetNumber !== null) {
                    setIsKinematic(true);
                    api.type.set('Kinematic');
                }
            });
            return () => subscription();
        }

        if (isKinematic && targetNumber !== null) {
            // Calculate target position based on rotation and desired number
            const idx = ROULETTE_SEQUENCE.indexOf(targetNumber);
            const slotAngle = (idx / 37) * Math.PI * 2;
            const currentRotation = rotationValue.current;
            const finalAngle = slotAngle + currentRotation;

            const radius = 3.5;
            const targetX = Math.sin(finalAngle) * radius;
            const targetZ = Math.cos(finalAngle) * radius;
            const targetY = 0.35;

            api.position.set(
                THREE.MathUtils.lerp(api.position.current[0] || targetX, targetX, delta * 5),
                THREE.MathUtils.lerp(api.position.current[1] || targetY, targetY, delta * 5),
                THREE.MathUtils.lerp(api.position.current[2] || targetZ, targetZ, delta * 5)
            );

            const dist = Math.sqrt((api.position.current[0] - targetX) ** 2 + (api.position.current[2] - targetZ) ** 2);
            if (dist < 0.05 && gameState === 'spinning') {
                if (settledSound.current) settledSound.current.play();
                onSettled();
            }
        }
    });

    return (
        <group>
            <mesh ref={ref} castShadow>
                <sphereGeometry args={[0.12, 32, 32]} />
                <meshStandardMaterial color="white" metalness={0.9} roughness={0.05} />
                <Trail width={1.5} length={8} color="#00ffff" attenuation={(t) => t * t}>
                    <meshBasicMaterial transparent opacity={0.3} />
                </Trail>
                {/* Audio 3D Spot */}
                <PositionalAudio ref={hitSound} url="https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3" distance={5} loop={false} />
                <PositionalAudio ref={settledSound} url="https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3" distance={5} loop={false} />
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
            desiredPos.set(0, 6, 12);
        } else if (state === 'result') {
            desiredPos.set(0, 4, 5);
        } else {
            const time = Date.now() * 0.0003;
            desiredPos.set(Math.sin(time) * 12, 8, Math.cos(time) * 12);
        }

        camera.position.lerp(desiredPos, delta * 2);
        currentTarget.current.lerp(lookAtPos, delta * 2);
        camera.lookAt(currentTarget.current);
    });

    return null;
};

const Roulette3D = ({ user, balance, onBalanceUpdate }) => {
    const [gameState, setGameState] = useState('idle');
    const [angularVelocity, setAngularVelocity] = useState(0);
    const [launchRequested, setLaunchRequested] = useState(0);
    const [status, setStatus] = useState("Esperando apuestas...");
    const [currentBets, setCurrentBets] = useState({});
    const [totalBetValue, setTotalBetValue] = useState(0);
    const [winData, setWinData] = useState(null);
    const rotationValue = useRef(0);

    const handleSpin = async () => {
        if (totalBetValue <= 0) return setStatus("¡Coloca una apuesta primero!");
        if (balance < totalBetValue) return setStatus("Saldo insuficiente");

        setStatus("Iniciando partida segura...");
        setGameState('spinning');
        setWinData(null);

        try {
            const response = await fetch('/api/roulette/spin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user?.id, bets: currentBets, totalBet: totalBetValue })
            });

            const data = await response.json();
            if (data.server_result !== undefined) {
                setWinData(data);
                setAngularVelocity(Math.floor(Math.random() * 800) + 1200);
                setLaunchRequested(prev => prev + 1);
                setStatus("Girando...");
            } else {
                throw new Error("Invalid server response");
            }
        } catch (error) {
            console.error('Spin Error:', error);
            setStatus(`Error: ${error.message}`);
            setGameState('idle');
        }
    };

    const handleSettled = () => {
        if (gameState !== 'result' && winData) {
            setGameState('result');
            const payout = winData.user_balance - (balance - totalBetValue);
            setStatus(`Resultado: ${winData.server_result} ${payout > 0 ? `| GANASTE: $${payout.toFixed(2)}` : '| Sigue intentando'}`);
            if (onBalanceUpdate) onBalanceUpdate();
        }
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
                            <Wheel spinning={gameState === 'spinning'} angularVelocity={angularVelocity} rotationValue={rotationValue} />
                            <Ball
                                launchRequested={launchRequested}
                                targetNumber={winData?.server_result}
                                rotationValue={rotationValue}
                                gameState={gameState}
                                onSettled={handleSettled}
                            />
                            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.25, 0]} receiveShadow>
                                <circleGeometry args={[10, 64]} />
                                <meshStandardMaterial color="#222" metalness={0.1} roughness={0.05} />
                            </mesh>
                        </Physics>
                    </Suspense>
                    <Environment preset="studio" />
                </Canvas>

                <div className="absolute top-12 left-1/2 -translate-x-1/2">
                    <div className="glass-panel px-10 py-4 rounded-full border border-white/20 bg-black/60 shadow-2xl backdrop-blur-xl">
                        <span className={`font-black tracking-[0.2em] uppercase text-xl transition-all duration-500 ${status.includes('GANASTE') ? 'text-neon-green drop-shadow-[0_0_10px_rgba(0,255,157,0.5)]' : 'text-white'}`}>
                            {status}
                        </span>
                    </div>
                </div>

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
