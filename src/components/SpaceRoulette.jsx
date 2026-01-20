import React, { useRef, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, PerspectiveCamera, MeshDistortMaterial, MeshWobbleMaterial, Sparkles, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

const RouletteWheel = ({ isSpinning, win, outcome }) => {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            if (isSpinning) {
                meshRef.current.rotation.y += 0.2; // Fast spin
            } else if (outcome !== null) {
                // Logic to align the wheel to the outcome number
                // For now, let's just slow down to a stop
                meshRef.current.rotation.y += 0.01;
            } else {
                meshRef.current.rotation.y += 0.01; // Idle rotation
            }
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh ref={meshRef} castShadow receiveShadow>
                <cylinderGeometry args={[2, 2.2, 0.8, 32]} />
                <meshStandardMaterial
                    color="#b026ff"
                    metalness={0.8}
                    roughness={0.2}
                    emissive="#b026ff"
                    emissiveIntensity={0.5}
                />
                {/* Decorative inner ring */}
                <mesh position={[0, 0.45, 0]}>
                    <torusGeometry args={[1.8, 0.05, 16, 100]} />
                    <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={2} />
                </mesh>
            </mesh>
        </Float>
    );
};

const WinParticles = ({ active }) => {
    const particlesRef = useRef();

    useFrame((state) => {
        if (active && particlesRef.current) {
            particlesRef.current.rotation.y += 0.05;
            particlesRef.current.position.y += Math.sin(state.clock.elapsedTime * 2) * 0.01;
        }
    });

    if (!active) return null;

    return (
        <Sparkles
            ref={particlesRef}
            count={200}
            scale={10}
            size={6}
            speed={2}
            color="#00ff9d"
            opacity={1}
        />
    );
};

const SceneContent = ({ isSpinning, win, outcome }) => {
    const cameraRef = useRef();

    useFrame((state) => {
        if (win && cameraRef.current) {
            const time = state.clock.elapsedTime * 10;
            cameraRef.current.position.x = Math.sin(time) * 0.1;
            cameraRef.current.position.y = Math.cos(time) * 0.1;
        }
    });

    return (
        <>
            <PerspectiveCamera makeDefault ref={cameraRef} position={[0, 5, 10]} />
            <OrbitControls enableZoom={false} enablePan={false} />

            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} color="#b026ff" intensity={2} />
            <pointLight position={[-10, 5, -10]} color="#00f3ff" intensity={2} />
            <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={2} castShadow />

            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

            <Suspense fallback={null}>
                <RouletteWheel isSpinning={isSpinning} win={win} outcome={outcome} />
                <WinParticles active={win} />
            </Suspense>

            <fog attach="fog" args={['#0a0a0a', 10, 25]} />
        </>
    );
};

const SpaceRoulette = ({ isSpinning = false, win = false, outcome = null }) => {
    return (
        <div className="w-full h-[500px] rounded-3xl overflow-hidden bg-black relative border border-white/5">
            <Canvas shadows dpr={[1, 2]}>
                <color attach="background" args={['#030303']} />
                <SceneContent isSpinning={isSpinning} win={win} outcome={outcome} />
            </Canvas>

            {/* HUD Info */}
            <div className="absolute top-6 left-6 pointer-events-none">
                <h3 className="text-white/40 text-xs font-bold uppercase tracking-[0.2em] mb-1">Gravity Engine</h3>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-purple animate-pulse"></div>
                    <span className="text-white text-sm font-medium">NEON ROULETTE v1.0</span>
                </div>
            </div>
        </div>
    );
};

export default SpaceRoulette;
