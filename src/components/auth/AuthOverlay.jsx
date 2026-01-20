import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Lock, Mail } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';

const AuthOverlay = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Login State
    const [loginData, setLoginData] = useState({ email: '', password: '' });

    // Register State
    const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                setError(
                    <div className="flex flex-col gap-2 items-center">
                        <span>Tu correo electrónico no ha sido verificado.</span>
                        <button
                            type="button"
                            onClick={() => handleResendVerification(user)}
                            className="bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-[10px] transition-all"
                        >
                            Re-enviar Correo de Activación
                        </button>
                    </div>
                );
                return;
            }

            // Successful login
            window.location.href = '/lobby';
        } catch (err) {
            console.error(err);
            let msg = err.message;
            if (err.code === 'auth/user-not-found') msg = 'Usuario no encontrado.';
            if (err.code === 'auth/wrong-password') msg = 'Contraseña incorrecta.';
            if (err.message.includes('Firebase:')) msg = err.message.replace('Firebase: ', '');
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendVerification = async (user) => {
        try {
            await sendEmailVerification(user);
            alert("Nuevo correo de verificación enviado. Por favor revisa tu bandeja de entrada.");
        } catch (err) {
            setError("Error al re-enviar: " + err.message);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!registerData.email || !registerData.name || !registerData.password) {
            setError("Por favor, rellena todos los campos.");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Create User
            const userCredential = await createUserWithEmailAndPassword(auth, registerData.email, registerData.password);
            const user = userCredential.user;

            // 2. Update Profile (Name)
            await updateProfile(user, {
                displayName: registerData.name
            });

            // 3. Send Verification Email
            await sendEmailVerification(user);

            // Success Feedback
            alert(`¡Registro iniciado! Se ha enviado un correo de verificación a ${registerData.email}. Por favor, confirma tu cuenta en tu bandeja de entrada antes de continuar.`);

            // Stay on login and inform
            setIsLogin(true);
            setLoginData({ email: registerData.email, password: '' });
            setError('Cuenta creada. Por favor verifica tu email para activar.');

        } catch (err) {
            console.error(err);
            let msg = err.message;
            if (err.code === 'auth/email-already-in-use') msg = 'Este correo ya está registrado.';
            if (err.code === 'auth/weak-password') msg = 'La contraseña debe tener al menos 6 caracteres.';
            if (err.message.includes('Firebase:')) msg = err.message.replace('Firebase: ', '');
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-sm p-4 font-sans">
            <AnimatePresence mode="wait">
                <motion.div
                    key={isLogin ? 'login' : 'register'}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative w-[350px] bg-[#121517] rounded-[25px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-[#555] hover:text-[#888] text-xl bg-none border-none cursor-pointer transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <h1 className="text-white text-[28px] font-black italic m-0 mb-1 leading-tight">
                        {isLogin ? 'INICIAR SESIÓN' : 'REGISTRARSE'}
                    </h1>
                    <p className="text-[#666] text-[10px] tracking-[1px] uppercase mb-[30px] font-sans">
                        {isLogin ? 'ACCESO A ANTIGRAVITY CASINO' : 'ÚNETE A ANTIGRAVITY CASINO'}
                    </p>

                    {error && (
                        <div className="mb-5 text-center text-red-400 text-xs bg-red-500/10 py-2 rounded-lg border border-red-500/20 font-bold">
                            {error}
                        </div>
                    )}

                    <form onSubmit={isLogin ? handleLogin : handleRegister} className="w-full">

                        {!isLogin && (
                            <div className="flex items-center bg-[#1a1d20] border border-[#333] rounded-xl mb-[15px] p-[12px_15px]">
                                <span className="text-[#666] mr-[10px] flex items-center justify-center">
                                    <User size={16} />
                                </span>
                                <input
                                    type="text"
                                    placeholder="NOMBRE DE USUARIO"
                                    required
                                    className="bg-transparent border-none text-white outline-none w-full text-[12px] font-bold placeholder-[#555]"
                                    value={registerData.name}
                                    onChange={e => setRegisterData({ ...registerData, name: e.target.value })}
                                />
                            </div>
                        )}

                        <div className="flex items-center bg-[#1a1d20] border border-[#333] rounded-xl mb-[15px] p-[12px_15px]">
                            <span className="text-[#666] mr-[10px] flex items-center justify-center">
                                <Mail size={16} />
                            </span>
                            <input
                                type="email"
                                placeholder="CORREO ELECTRÓNICO"
                                required
                                className="bg-transparent border-none text-white outline-none w-full text-[12px] font-bold placeholder-[#555]"
                                value={isLogin ? loginData.email : registerData.email}
                                onChange={e => isLogin ? setLoginData({ ...loginData, email: e.target.value }) : setRegisterData({ ...registerData, email: e.target.value })}
                            />
                        </div>

                        <div className="flex items-center bg-[#1a1d20] border border-[#333] rounded-xl mb-[15px] p-[12px_15px]">
                            <span className="text-[#666] mr-[10px] flex items-center justify-center">
                                <Lock size={16} />
                            </span>
                            <input
                                type="password"
                                placeholder="CONTRASEÑA"
                                required
                                className="bg-transparent border-none text-white outline-none w-full text-[12px] font-bold placeholder-[#555]"
                                value={isLogin ? loginData.password : registerData.password}
                                onChange={e => isLogin ? setLoginData({ ...loginData, password: e.target.value }) : setRegisterData({ ...registerData, password: e.target.value })}
                            />
                        </div>

                        <button
                            disabled={isLoading}
                            className="w-full p-[15px] border-none rounded-xl bg-gradient-to-r from-[#00f2ff] to-[#b458ff] text-white font-bold text-[14px] uppercase cursor-pointer mt-[10px] hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'PROCESANDO...' : (isLogin ? 'ENTRAR 🚀' : 'CREAR CUENTA 🚀')}
                        </button>
                    </form>

                    <div className="mt-[25px]">
                        <p className="text-[#666] text-[10px] font-bold">
                            {isLogin ? '¿NO TIENES CUENTA?' : '¿YA TIENES CUENTA?'}
                            <button
                                onClick={toggleForm}
                                className="ml-1 text-[#888] underline hover:text-white transition-colors cursor-pointer bg-transparent border-none"
                            >
                                {isLogin ? 'REGÍSTRATE AQUÍ' : 'INICIA SESIÓN AQUÍ'}
                            </button>
                        </p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default AuthOverlay;
