import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Wallet,
    LogOut,
    ArrowUpCircle,
    Loader2,
    CheckCircle2,
    AlertCircle,
    QrCode,
    CreditCard,
    Smartphone,
    Building2,
    Hash,
    Copy,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WalletManager = ({ user, refreshBalance }) => {
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('binance'); // 'binance' or 'pago_movil'
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [reference, setReference] = useState('');
    const [gateways, setGateways] = useState({
        binance: { address: '', is_active: false },
        pago_movil: { phone: '', bank: '', ci: '', is_active: false }
    });
    const [copied, setCopied] = useState(null);

    useEffect(() => {
        fetchGateways();
    }, []);

    const fetchGateways = async () => {
        const { data } = await supabase.from('payment_gateways').select('*');
        if (data) {
            const binance = data.find(g => g.id === 'binance_pay');
            const pm = data.find(g => g.id === 'pago_movil');
            setGateways({
                binance: binance?.config || { address: '', is_active: false },
                pago_movil: pm?.config || { phone: '', bank: '', ci: '', is_active: false }
            });
        }
    };

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleSubmitDeposit = async () => {
        if (!amount || !reference) return;
        setStatus('submitting');

        try {
            const { error } = await supabase.from('deposits').insert({
                user_id: user.id,
                amount: parseFloat(amount),
                method: method,
                reference: reference,
                status: 'pending'
            });

            if (error) throw error;
            setStatus('success');
            setAmount('');
            setReference('');
            if (refreshBalance) refreshBalance();
        } catch (err) {
            console.error('Deposit Error:', err);
            setStatus('error');
        }
    };

    const activeGateway = method === 'binance' ? gateways.binance : gateways.pago_movil;

    return (
        <div className="flex flex-col gap-6 p-6 glass-panel border border-white/10 rounded-2xl bg-black/40 backdrop-blur-2xl min-w-[340px] shadow-2xl">
            {/* Method Selector */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                    onClick={() => setMethod('binance')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-tighter rounded-lg transition-all ${method === 'binance' ? 'bg-[#F3BA2F] text-black shadow-[0_0_15px_rgba(243,186,47,0.3)]' : 'text-gray-400 hover:text-white'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${gateways.binance.is_active ? 'bg-neon-green' : 'bg-red-500'}`} />
                    Binance Pay
                </button>
                <button
                    onClick={() => setMethod('pago_movil')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-tighter rounded-lg transition-all ${method === 'pago_movil' ? 'bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,255,0.3)]' : 'text-gray-400 hover:text-white'}`}
                >
                    <div className={`w-1.5 h-1.5 rounded-full ${gateways.pago_movil.is_active ? 'bg-neon-green' : 'bg-red-500'}`} />
                    Pago Móvil
                </button>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                >
                    {!activeGateway.is_active ? (
                        <div className="py-10 text-center opacity-40 italic uppercase tracking-widest text-[10px]">
                            Esta pasarela se encuentra en mantenimiento
                        </div>
                    ) : (
                        <>
                            {/* Payment Info Box */}
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/10 space-y-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                    <Hash size={12} /> Datos de Transferencia
                                </h3>

                                {method === 'binance' ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[9px] uppercase font-bold text-gray-400">Dirección USDT (BEP20)</span>
                                            <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5 group">
                                                <code className="text-xs font-mono text-[#F3BA2F] truncate max-w-[180px]">{gateways.binance.address}</code>
                                                <button onClick={() => handleCopy(gateways.binance.address, 'addr')} className="text-gray-500 hover:text-white transition-colors">
                                                    {copied === 'addr' ? <Check size={16} className="text-neon-green" /> : <Copy size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Smartphone size={16} className="text-neon-cyan" />
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] uppercase font-bold text-gray-500">Teléfono</span>
                                                    <span className="text-xs font-mono text-white">{gateways.pago_movil.phone}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => handleCopy(gateways.pago_movil.phone, 'phone')} className="text-gray-500 hover:text-white">
                                                {copied === 'phone' ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                <span className="text-[8px] uppercase font-bold text-gray-500 block">Banco</span>
                                                <span className="text-xs font-black text-white italic truncate">{gateways.pago_movil.bank}</span>
                                            </div>
                                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                                                <span className="text-[8px] uppercase font-bold text-gray-500 block text-right">Cédula / RIF</span>
                                                <span className="text-xs font-mono text-white text-right block">{gateways.pago_movil.ci}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submission Form */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Monto a Depositar (USDT/$)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-lg font-black italic tracking-tighter text-white focus:outline-none focus:border-neon-cyan/50 transition-all font-mono"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-gray-500 ml-1">Referencia / Hash de Pago</label>
                                    <input
                                        type="text"
                                        value={reference}
                                        onChange={(e) => setReference(e.target.value)}
                                        placeholder="Ej: 832941..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-5 text-sm font-mono text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                                    />
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSubmitDeposit}
                                    disabled={!amount || !reference || status === 'submitting'}
                                    className={`w-full py-5 rounded-2xl font-black italic uppercase tracking-tighter text-lg flex items-center justify-center gap-3 transition-all shadow-xl disabled:opacity-50 ${method === 'binance' ? 'bg-[#F3BA2F] text-black shadow-[#F3BA2F]/20' : 'bg-neon-cyan text-black shadow-neon-cyan/20'}`}
                                >
                                    {status === 'submitting' ? <Loader2 className="animate-spin" /> : <ArrowUpCircle />}
                                    {status === 'submitting' ? 'Enviando Reporte...' : 'Notificar Pago'}
                                </motion.button>
                            </div>
                        </>
                    )}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {status === 'success' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col gap-2 bg-neon-green/10 p-4 rounded-xl border border-neon-green/20"
                    >
                        <div className="flex items-center gap-2 text-neon-green text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 size={16} /> Reporte Recibido
                        </div>
                        <p className="text-[10px] text-gray-300 uppercase leading-relaxed">
                            Tu depósito está siendo verificado. El saldo se acreditará una vez que el administrador confirme la transacción.
                        </p>
                    </motion.div>
                )}
                {status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-3 bg-neon-pink/10 p-4 rounded-xl border border-neon-pink/20 text-neon-pink text-[10px] font-black uppercase tracking-widest"
                    >
                        <AlertCircle size={16} /> Error al enviar reporte. Reintenta.
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WalletManager;
