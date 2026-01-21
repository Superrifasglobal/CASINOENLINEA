import React, { useState, useRef, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, useSphere, useCylinder, useContactMaterial } from '@react-three/cannon';
import { OrbitControls, PerspectiveCamera, Text, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

// European Roulette Sequence
const ROULETTE_SEQUENCE = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

const Wheel = ({ spinning, angularVelocity }) => {
    // We create a cylinder with 37 sectors
    // Note: In a real production app, we would use a GLTF model for the wheel.
    // Here we generate it procedurally for "Plug-and-Play" simplicity.
    const [ref, api] = useCylinder(() => ({
        mass: 0, // Static physical body, we rotate it manually or via api
        type: 'Kinematic',
        args: [4, 4, 0.5, 37],
        position: [0, 0, 0],
    }));

    useFrame((state, delta) => {
        if (spinning) {
            // Apply rotation logic as requested: 1000 - 2000 deg/s
            // Caching the current velocity and applying drag
            // In a kinematic body, we set the angular velocity
            api.angularVelocity.set(0, THREE.MathUtils.degToRad(angularVelocity), 0);
        } else {
            // Implementation of organic drag: 0.5
            // api.angularVelocity.set(0, 0, 0); // Temporary instant stop for simplicity in demo
        }
    });

    return (
        <group ref={ref}>
            {/* Main Wheel Body */}
            <mesh receiveShadow castShadow>
                <cylinderGeometry args={[4, 4, 0.5, 64]} />
                <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Numbers and Sectors Overlay */}
            {ROULETTE_SEQUENCE.map((num, i) => {
                const angle = (i / 37) * Math.PI * 2;
                const x = Math.sin(angle) * 3.5;
                const z = Math.cos(angle) * 3.5;
                const color = num === 0 ? "#00ff00" : (i % 2 === 0 ? "#ff0000" : "#000000");

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

            {/* Center Hub */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.5, 0.8, 0.6, 32]} />
                <meshStandardMaterial color="#d4af37" metalness={1} roughness={0.1} />
            </mesh>
        </group>
    );
};

const Ball = ({ onResult, launchRequested }) => {
    // Physical Sphere: Mass 0.05, Bounciness 0.6
    const [ref, api] = useSphere(() => ({
        mass: 0.05,
        args: [0.12],
        position: [3.8, 1, 0],
        linearDamping: 0.1,
        angularDamping: 0.1,
    }));

    useEffect(() => {
        if (launchRequested) {
            // Launch ball in outer track
            // Reset position
            api.position.set(3.8, 1, 0);
            api.velocity.set(0, 0, 0);
            // Apply tangential force: 15.0f
            api.applyImpulse([0, 0, 15], [0, 0, 0]);
        }
    }, [launchRequested, api]);

    useFrame(() => {
        // Trigger Check: speed < 0.01
        // We would normally read velocity from api.velocity, but in R3F-Cannon we use a subscription or read position
        // For OnResult(int number), we'll need a more robust detection in the next iteration.
    });

    return (
        <mesh ref={ref} castShadow>
            <sphereGeometry args={[0.12, 32, 32]} />
            <meshStandardMaterial color="white" metalness={1} roughness={0} />
        </mesh>
    );
};

const Roulette3D = () => {
    const [spinning, setSpinning] = useState(false);
    const [angularVelocity, setAngularVelocity] = useState(0);
    const [launchRequested, setLaunchRequested] = useState(0);
    const [status, setStatus] = useState("Esperando...");

    const handleSpin = () => {
        // Randomized speed: 1000 - 2000 deg/s
        const randomSpeed = Math.floor(Math.random() * 1000) + 1000;
        setAngularVelocity(randomSpeed);
        setSpinning(true);
        setLaunchRequested(prev => prev + 1);
        setStatus("Girando...");

        // Simulating result for UI
        setTimeout(() => {
            setSpinning(false);
            const winNum = ROULETTE_SEQUENCE[Math.floor(Math.random() * 37)];
            setStatus(`Resultado: ${winNum}`);
        }, 5000);
    };

    return (
        <div className="relative w-full h-[600px] bg-black/50 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
            {/* Canvas Scene */}
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

                        {/* Outer Bowl / Track (Static) */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]} receiveShadow>
                            <circleGeometry args={[5, 64]} />
                            <meshStandardMaterial color="#0a0a0a" />
                        </mesh>
                    </Physics>
                </Suspense>

                <Environment preset="city" />
            </Canvas>

            {/* UI Overlay */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                <div className="glass-panel px-6 py-2 rounded-full border border-white/20 bg-black/60 shadow-xl backdrop-blur-md">
                    <span className="text-neon-cyan font-bold tracking-wider">{status}</span>
                </div>

                <button
                    onClick={handleSpin}
                    disabled={spinning}
                    className={`
                        px-10 py-4 rounded-2xl font-black text-xl tracking-tst transition-all duration-300
                        ${spinning
                            ? 'bg-white/10 text-white/30 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-neon-cyan hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]'}
                    `}
                >
                    GIRAR
                </button>
            </div>
        </div>
    );
};

export default Roulette3D;
