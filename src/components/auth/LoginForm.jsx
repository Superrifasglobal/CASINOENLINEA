import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signIn } from 'next-auth/react';
// import { useRouter } from 'next/navigation'; // Only if we are inside Next.js, but keeping generic for now or assuming window.location for safety if environment is mixed.

const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password,
            });

            if (res?.error) {
                throw new Error(res.error);
            }

            // Check if this is the specific admin user to trigger special UI flow (optional immediate feedback)
            // Otherwise regular redirect
            window.location.href = '/lobby';

        } catch (err) {
            setError("Invalid coordinates. Access denied.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative w-full max-w-md mx-auto p-1">
            {/* Deep Blue/Cyan Glow Background for Login differentiation */}
            <div className="absolute inset-0 bg-cyan-600/20 blur-[60px] rounded-full -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            >
                <h2 className="text-3xl font-bold text-center text-white mb-6 tracking-wide">
                    Mainframe <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Access</span>
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-gray-400 text-sm ml-1">Email</label>
                        <motion.input
                            whileFocus={{ scale: 1.02, borderColor: "rgba(34, 211, 238, 0.8)", boxShadow: "0 0 15px rgba(34, 211, 238, 0.3)" }}
                            type="email"
                            placeholder="admin@antigravity.io"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-all duration-300"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-gray-400 text-sm ml-1">Passcode</label>
                        <motion.input
                            whileFocus={{ scale: 1.02, borderColor: "rgba(34, 211, 238, 0.8)", boxShadow: "0 0 15px rgba(34, 211, 238, 0.3)" }}
                            type="password"
                            placeholder="••••••••"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-all duration-300"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isLoading}
                        className="w-full py-3.5 mt-2 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg text-white font-bold tracking-wider shadow-[0_0_20px_rgba(8,145,178,0.5)] hover:shadow-[0_0_30px_rgba(8,145,178,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Verifying...' : 'ENGAGE'}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default LoginForm;
