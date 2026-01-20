import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Rocket, X, AlertCircle, User, Facebook, Chrome } from 'lucide-react';
import { auth } from '../lib/firebase';
import { 
    signInWithPopup, 
    GoogleAuthProvider, 
    FacebookAuthProvider, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    updateProfile, 
    sendEmailVerification 
} from 'firebase/auth';

const AuthOverlay = ({ isOpen, onClose, onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuthSuccess = (user) => {
        if (onAuthSuccess && typeof onAuthSuccess === 'function') {
            onAuthSuccess({
                id: user.uid,
                email: user.email,
                displayName: user.displayName || user.email?.split('@')[0],
                photoURL: user.photoURL,
                emailVerified: user.emailVerified,
                balance: 0 // In a real app, fetch this from DB
            });
        }
        onClose();
    };

    const handleSocialLogin = async (providerName) => {
        setLoading(true);
        setError('');
        try {
            let provider;
            if (providerName === 'google') {
                provider = new GoogleAuthProvider();
            } else if (providerName === 'facebook') {
                provider = new FacebookAuthProvider();
            }

            const result = await signInWithPopup(auth, provider);
            handleAuthSuccess(result.user);
        } catch (err) {
            console.error("Social Auth Error:", err);
            let msg = "Error al iniciar sesión con " + providerName;
            if (err.code === 'auth/account-exists-with-different-credential') {
                msg = "Ya existe una cuenta con el mismo correo electrónico pero diferentes credenciales de inicio de sesión.";
            } else if (err.code === 'auth/popup-closed-by-user') {
                msg = "La ventana de inicio de sesión se cerró antes de completar el proceso.";
            } else if (err.code === 'auth/cancelled-popup-request') {
                msg = "Solo se permite una solicitud de ventana emergente a la vez.";
            } else if (err.code === 'auth/popup-blocked') {
                msg = "El navegador bloqueó la ventana emergente. Por favor, permítela para continuar.";
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (isLogin) {
                // Login
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                handleAuthSuccess(userCredential.user);
            } else {
                // Register
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Update Profile
                await updateProfile(user, {
                    displayName: displayName
                });

                // Send Verification Email
                await sendEmailVerification(user);
                
                alert(`¡Cuenta creada! Se ha enviado un correo de verificación a ${email}`);
                handleAuthSuccess(user);
            }
        } catch (err) {
            console.error("Auth Error:", err);
            let msg = "Error de autenticación";
            switch (err.code) {
                case 'auth/invalid-email':
                    msg = "El correo electrónico no es válido.";
                    break;
                case 'auth/user-disabled':
                    msg = "Esta cuenta ha sido deshabilitada.";
                    break;
                case 'auth/user-not-found':
                    msg = "No se encontró ninguna cuenta con este correo.";
                    break;
                case 'auth/wrong-password':
                    msg = "Contraseña incorrecta.";
                    break;
                case 'auth/email-already-in-use':
                    msg = "Este correo electrónico ya está en uso.";
                    break;
                case 'auth/weak-password':
                    msg = "La contraseña es muy débil (mínimo 6 caracteres).";
                    break;
                default:
                    msg = err.message;
            }
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

                <div className="flex justify-between items-center mb-6 relative">
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

                {/* Social Login Buttons */}
                <div className="flex gap-3 mb-6 relative z-10">
                    <button
                        onClick={() => handleSocialLogin('google')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all group"
                    >
                        <Chrome size={20} className="text-white group-hover:text-neon-blue transition-colors" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Google</span>
                    </button>
                    <button
                        onClick={() => handleSocialLogin('facebook')}
                        disabled={loading}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3 transition-all group"
                    >
                        <Facebook size={20} className="text-white group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-300">Facebook</span>
                    </button>
                </div>

                <div className="relative flex items-center justify-center mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                    </div>
                    <span className="relative bg-[#0a0a0a] px-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        O usa tu correo
                    </span>
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

                    <div className="text-center mt-6 flex flex-col gap-2">
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
