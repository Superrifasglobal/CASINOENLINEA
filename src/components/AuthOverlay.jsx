import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Rocket, X, AlertCircle, User } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';

const AuthOverlay = ({ isOpen, onClose, onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Login with Firebase
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Call success callback
                onAuthSuccess({
                    id: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    balance: 0 // You'd fetch this from your backend
                });
                onClose();
            } else {
                // Register with Firebase
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Update profile with display name
                await updateProfile(user, { displayName });

                // Send verification email
                await sendEmailVerification(user);

                alert(`¡Registro exitoso para ${displayName}! Hemos enviado un correo de verificación a ${email}.`);

                onAuthSuccess({
                    id: user.uid,
                    email: user.email,
                    displayName: displayName,
                    balance: 0
                });
                onClose();
            }
        } catch (err) {
            console.error(err);
            let msg = err.message.replace('Firebase: ', '');
            if (err.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado.';
            if (err.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
            if (err.code === 'auth/invalid-credential') msg = 'Credenciales inválidas.';
            if (err.code === 'auth/user-not-found') msg = 'Usuario no encontrado.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative w-full max-w-md glass-panel p-8 rounded-[2.5rem] border border-white/10 bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-blue/20 blur-[80px] rounded-full" />
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-neon-purple/20 blur-[80px] rounded-full" />

                <div className="flex justify-between items-center mb-8 relative">
                    <div>
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter">
                            {isLogin ? 'Iniciar Sesión' : 'Registro'}
                        </h2>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                            Acceso a Antigravity Casino
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 relative">
                    <div className="space-y-4">
                        {/* Name field (only for registration) */}
                        {!isLogin && (
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-green transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="NOMBRE DE USUARIO"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-neon-green/50 focus:bg-white/[0.08] transition-all"
                                    required
                                />
                            </div>
                        )}

                        {/* Email field */}
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" size={18} />
                            <input
                                type="email"
                                placeholder="CORREO ELECTRÓNICO"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-neon-blue/50 focus:bg-white/[0.08] transition-all"
                                required
                            />
                        </div>

                        {/* Password field */}
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-purple transition-colors" size={18} />
                            <input
                                type="password"
                                placeholder="CONTRASEÑA"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold tracking-widest focus:outline-none focus:border-neon-purple/50 focus:bg-white/[0.08] transition-all"
                                required
                            />
                        </div>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-neon-pink/10 border border-neon-pink/20 text-neon-pink p-4 rounded-xl flex items-center gap-3 text-xs font-bold"
                        >
                            <AlertCircle size={16} />
                            {error}
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full group flex items-center justify-center gap-3 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-neon-blue/20 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span className="text-xs uppercase tracking-widest">{isLogin ? 'Entrar' : 'Crear Cuenta'}</span>
                                <Rocket size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </button>

                    <div className="text-center mt-6">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors underline decoration-neon-blue/30 underline-offset-4"
                        >
                            {isLogin ? '¿No tienes cuenta? Registrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AuthOverlay;
