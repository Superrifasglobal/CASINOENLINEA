import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, OrbitControls, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// European Roulette Order
const WHEEL_NUMBERS = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

function Wheel({ spinning, outcome, onStop }) {
    const groupRef = useRef();
    const [speed, setSpeed] = useState(0);
    const [rotation, setRotation] = useState(0);

    // Antigravity float state
    useFrame((state) => {
        if (!groupRef.current) return;

        // Antigravity drift
        const t = state.clock.getElapsedTime();
        groupRef.current.position.y = Math.sin(t * 0.5) * 0.2;
        groupRef.current.rotation.x = Math.sin(t * 0.2) * 0.05 + 0.2; // Slight tilt

        // Spin Logic
        if (spinning) {
            // Accelerate
            if (speed < 0.2) setSpeed(prev => prev + 0.005);
            groupRef.current.rotation.z -= speed;
            setRotation(groupRef.current.rotation.z);
        } else if (outcome !== null && speed > 0) {
            // Decelerate to target
            // Calculate target angle based on index
            const index = WHEEL_NUMBERS.indexOf(outcome);
            const anglePerSector = (Math.PI * 2) / 37;
            // Target rotation should align the number at the top (usually offset by -PI/2 or similar depending on model orientation)
            // Let's assume Top is 12 o'clock.

            // Simple decay for now, visual polish needs precise math
            const decay = 0.98;
            setSpeed(prev => Math.max(0, prev * decay));
            groupRef.current.rotation.z -= speed;

            if (speed < 0.001) {
                setSpeed(0);
                onStop?.();
            }
        }
    });

    // Helper to get color
    const getColor = (num) => {
        if (num === 0) return '#4ade80'; // Green-ish
        return RED_NUMBERS.includes(num) ? '#ef4444' : '#1f2937'; // Red or Dark Gray
    };

    return (
        <group ref={groupRef} rotation={[0.2, 0, 0]}>
            {/* Wheel Base */}
            <mesh receiveShadow castShadow>
                <cylinderGeometry args={[4, 4, 0.5, 64]} />
                <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Neon Rim */}
            <mesh position={[0, -0.26, 0]}>
                <torusGeometry args={[4.1, 0.1, 16, 100]} />
                <meshBasicMaterial color="#a855f7" toneMapped={false} />
            </mesh>

            {/* Numbers */}
            {WHEEL_NUMBERS.map((num, i) => {
                const angle = (i / 37) * Math.PI * 2;
                const radius = 3.2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                    <group key={num} position={[x, 0.5, y]} rotation={[-Math.PI / 2, 0, angle + Math.PI / 2]}>
                        <FloatText num={num} color={getColor(num)} />
                        {/* Slot base */}
                        <mesh position={[0, -0.1, 0]}>
                            <boxGeometry args={[0.5, 0.05, 0.6]} />
                            <meshStandardMaterial color={getColor(num)} metalness={0.5} roughness={0.5} />
                        </mesh>
                    </group>
                );
            })}

            {/* Center Cap */}
            <mesh position={[0, 0.3, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 0.2, 32]} />
                <meshStandardMaterial color="#fbbf24" metalness={1} roughness={0.1} />
            </mesh>
        </group>
    );
}

function FloatText({ num, color }) {
    // Floating text effect separate from wheel spin
    const mesh = useRef();
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        // Individual float offset based on number to create wave
        if (mesh.current) {
            mesh.current.position.y = Math.sin(t * 2 + num) * 0.05 + 0.1;
        }
    });

    return (
        <group ref={mesh}>
            <Text
                fontSize={0.4}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor={color}
            >
                {num}
            </Text>
        </group>
    );
}

function Particles({ active }) {
    if (!active) return null;
    return (
        <Sparkles
            count={100}
            scale={8}
            size={4}
            speed={0.4}
            opacity={1}
            color="#fbbf24"
        />
    );
}

export default function Roulette3D({ spinning, outcome, onStop }) {
    return (
        <div className="w-full h-[500px] bg-black/50 rounded-xl overflow-hidden shadow-2xl border border-purple-500/20">
            <Canvas shadows camera={{ position: [0, 8, 10], fov: 45 }}>
                <color attach="background" args={['#050505']} />

                {/* Lighting */}
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#a855f7" />

                {/* Scene */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
                <Wheel spinning={spinning} outcome={outcome} onStop={onStop} />
                <Particles active={!spinning && outcome !== null} />

                <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2} minPolarAngle={0} />
            </Canvas>
        </div>
    );
}
