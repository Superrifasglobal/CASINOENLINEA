import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const RTPManager = () => {
    const [globalRtp, setGlobalRtp] = useState(0.95);
    const [rouletteRtp, setRouletteRtp] = useState(0.95);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const ADMIN_TOKEN = '29971627Nex@';

    const saveSettings = async (type, value) => {
        setLoading(true);
        setSuccess(false);
        try {
            const endpoint = type === 'global' ? '/api/admin/update-odds' : '/api/admin/roulette/rtp';
            const body = type === 'global' ? { rtp: value } : { rtp: value };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ADMIN_TOKEN}`
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (error) {
            console.error('Error saving RTP:', error);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col gap-8 max-w-4xl">
            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-neon-blue/20 rounded-lg">
                        <Settings className="text-neon-blue" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter">Configuración de RTP Global</h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Afecta principalmente a Tragamonedas y algoritmos base</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Retorno al Jugador (RTP)</label>
                            <span className="text-3xl font-mono text-neon-blue font-black">{(globalRtp * 100).toFixed(1)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.80" max="0.99" step="0.01"
                            value={globalRtp}
                            onChange={(e) => setGlobalRtp(parseFloat(e.target.value))}
                            className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                        />
                        <div className="flex justify-between text-[10px] text-gray-600 font-bold">
                            <span>MÍN: 80%</span>
                            <span>MÁX: 99%</span>
                        </div>
                    </div>

                    <button
                        onClick={() => saveSettings('global', globalRtp)}
                        disabled={loading}
                        className="group flex items-center gap-2 bg-neon-blue text-black font-black py-4 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,163,255,0.2)] disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        <span className="text-xs uppercase tracking-widest">Guardar RTP Global</span>
                    </button>
                </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-white/10 bg-black/40">
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-neon-green/20 rounded-lg">
                        <RefreshCw className="text-neon-green" size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter">Control de Probabilidad Ruleta</h2>
                        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Ajuste de sesgo algorítmico para Neon Roulette</p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Margen de la Casa</label>
                            <span className="text-3xl font-mono text-neon-green font-black">{((1 - rouletteRtp) * 100).toFixed(1)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.85" max="0.98" step="0.01"
                            value={rouletteRtp}
                            onChange={(e) => setRouletteRtp(parseFloat(e.target.value))}
                            className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer accent-neon-green"
                        />
                        <div className="flex justify-between text-[10px] text-gray-600 font-bold">
                            <span>AGRESIVO: 85%</span>
                            <span>ESTÁNDAR: 98%</span>
                        </div>
                    </div>

                    <button
                        onClick={() => saveSettings('roulette', rouletteRtp)}
                        disabled={loading}
                        className="group flex items-center gap-2 bg-neon-green text-black font-black py-4 px-8 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(0,255,157,0.2)] disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                        <span className="text-xs uppercase tracking-widest">Aplicar Sesgo Ruleta</span>
                    </button>
                </div>
            </div>

            {success && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-8 right-8 bg-neon-green text-black px-6 py-4 rounded-2xl font-black shadow-[0_0_50px_rgba(0,255,157,0.3)] flex items-center gap-3"
                >
                    <AlertCircle size={20} />
                    ¡CAMBIOS APLICADOS CON ÉXITO!
                </motion.div>
            )}
        </div>
    );
};

export default RTPManager;
