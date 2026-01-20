import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom'; // Assuming Vite + React Router based on file structure
// If Next.js App Router, usage would be 'next/navigation'
// But structure suggests Vite (src/main.jsx). I will use standard react-router-dom hooks or window.location if router not clear.
// Adjusting to generic fetch for now.

const RegisterForm = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Error en el registro');

            // Success
            setShowWelcome(true);

            // Redirect after animation
            setTimeout(() => {
                window.location.href = '/lobby'; // Or use router.push('/lobby')
            }, 3000);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full max-w-md mx-auto p-1">
            {/* Deep Purple Glow Background */}
            <div className="absolute inset-0 bg-purple-600/30 blur-[60px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            >
                <h2 className="text-3xl font-bold text-center text-white mb-6 tracking-wide">
                    Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">Verse</span>
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-1">
                        <label className="text-gray-400 text-sm ml-1">Username</label>
                        <motion.input
                            whileFocus={{ scale: 1.02, borderColor: "rgba(192, 132, 252, 0.8)", boxShadow: "0 0 15px rgba(192, 132, 252, 0.3)" }}
                            type="text"
                            placeholder="Commander Name"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all duration-300"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-gray-400 text-sm ml-1">Email</label>
                        <motion.input
                            whileFocus={{ scale: 1.02, borderColor: "rgba(192, 132, 252, 0.8)", boxShadow: "0 0 15px rgba(192, 132, 252, 0.3)" }}
                            type="email"
                            placeholder="pilot@cosmos.com"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all duration-300"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-gray-400 text-sm ml-1">Password</label>
                        <motion.input
                            whileFocus={{ scale: 1.02, borderColor: "rgba(192, 132, 252, 0.8)", boxShadow: "0 0 15px rgba(192, 132, 252, 0.3)" }}
                            type="password"
                            placeholder="••••••••"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-all duration-300"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isLoading}
                        className="w-full py-3.5 mt-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-lg text-white font-bold tracking-wider shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(139,92,246,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Igniting Thrusters...' : 'LAUNCH'}
                    </motion.button>
                </form>
            </motion.div>

            {/* Welcome to Space Animation Overlay */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md"
                    >
                        <div className="text-center relative">
                            <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.8, ease: "backOut" }}
                                className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white"
                            >
                                WELCOME TO ORBIT
                            </motion.div>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-4 text-gray-300 text-xl"
                            >
                                Prepare for Antigravity...
                            </motion.p>

                            {/* Particle effects or specific simple CSS stars could be added here */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.5 }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500 rounded-full blur-[100px]"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RegisterForm;
