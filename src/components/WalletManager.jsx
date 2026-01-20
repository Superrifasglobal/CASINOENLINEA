import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { Wallet, LogOut, ArrowUpCircle, Loader2, CheckCircle2, AlertCircle, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HOUSE_WALLET_ADDRESS = '0x1234567890123456789012345678901234567890'; // Placeholder
const API_BASE = '/api';

const WalletManager = () => {
    const { address, isConnected } = useAccount();
    const { connect, connectors, error: connectError, isPending: isConnecting } = useConnect();
    const { disconnect } = useDisconnect();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('crypto'); // 'crypto' or 'binance'
    const [status, setStatus] = useState('idle'); // idle, sending, confirming, success, error, generating, qr_ready
    const [binanceData, setBinanceData] = useState(null);

    const { sendTransaction, data: hash, error: sendError } = useSendTransaction();

    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash,
    });

    const handleConnect = () => {
        const metamask = connectors.find((c) => c.id === 'injected');
        if (metamask) {
            connect({ connector: metamask });
        } else {
            alert('MetaMask no detectado. Por favor instálalo.');
        }
    };

    const handleDeposit = async () => {
        if (!amount || isNaN(amount)) return;

        if (method === 'crypto') {
            setStatus('sending');
            try {
                sendTransaction({
                    to: HOUSE_WALLET_ADDRESS,
                    value: parseEther(amount),
                });
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
        } else {
            setStatus('generating');
            try {
                const response = await fetch(`${API_BASE}/binance/create`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: parseFloat(amount), currency: 'USDT' }),
                });
                const data = await response.json();
                setBinanceData(data);
                setStatus('qr_ready');
            } catch (err) {
                console.error(err);
                setStatus('error');
            }
        }
    };

    // Sync with Cloudflare Worker once confirmed (for Crypto)
    React.useEffect(() => {
        if (isConfirmed && hash) {
            setStatus('success');
            notifyBackend(hash, amount);
        }
    }, [isConfirmed, hash]);

    const notifyBackend = async (txHash, depositAmount) => {
        try {
            const response = await fetch(`${API_BASE}/verify-deposit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    txHash,
                    amount: depositAmount,
                }),
            });
            if (!response.ok) throw new Error('Backend sync failed');
        } catch (err) {
            console.error('Worker error:', err);
        }
    };

    return (
        <div className="flex flex-col gap-4 p-4 glass-panel border border-white/10 rounded-2xl bg-black/20 backdrop-blur-xl min-w-[320px]">
            {/* Method Selector */}
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                <button
                    onClick={() => setMethod('crypto')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${method === 'crypto' ? 'bg-neon-green text-black' : 'text-gray-400 hover:text-white'}`}
                >
                    Web3 (ETH)
                </button>
                <button
                    onClick={() => setMethod('binance')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${method === 'binance' ? 'bg-[#F3BA2F] text-black' : 'text-gray-400 hover:text-white'}`}
                >
                    Binance Pay
                </button>
            </div>

            {!isConnected && method === 'crypto' ? (
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-neon-green to-neon-blue text-black font-bold py-3 px-6 rounded-xl shadow-[0_0_20px_rgba(0,255,157,0.3)] transition-all disabled:opacity-50"
                >
                    {isConnecting ? <Loader2 className="animate-spin" size={20} /> : <Wallet size={20} />}
                    {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
                </motion.button>
            ) : (
                <div className="flex flex-col gap-4">
                    {isConnected && method === 'crypto' && (
                        <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Wallet Conectada</span>
                                <span className="text-sm font-mono text-white truncate max-w-[150px]">
                                    {address.slice(0, 6)}...{address.slice(-4)}
                                </span>
                            </div>
                            <button
                                onClick={() => disconnect()}
                                className="p-2 text-gray-400 hover:text-neon-pink transition-colors"
                                title="Desconectar"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}

                    {status === 'qr_ready' && binanceData ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center gap-4 p-4 bg-white rounded-2xl"
                        >
                            <img src={binanceData.qrcodeLink} alt="Binance QR" className="w-48 h-48" />
                            <p className="text-black text-[10px] font-bold text-center">Escanea con la App de Binance para pagar {amount} USDT</p>
                            <button
                                onClick={() => { setStatus('idle'); setBinanceData(null); }}
                                className="text-xs text-gray-500 underline"
                            >
                                Cancelar
                            </button>
                        </motion.div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                                    Monto ({method === 'crypto' ? 'ETH' : 'USDT'})
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white focus:outline-none focus:border-neon-green/50 transition-all font-mono"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">
                                        {method === 'crypto' ? 'ETH' : 'USDT'}
                                    </span>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDeposit}
                                disabled={!amount || isConfirming || status === 'sending' || status === 'generating'}
                                className={`flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-xl border transition-all disabled:opacity-50 group ${method === 'crypto' ? 'bg-white/10 hover:bg-neon-green hover:text-black border-white/10 hover:border-neon-green text-white' : 'bg-[#F3BA2F]/20 hover:bg-[#F3BA2F] hover:text-black border-[#F3BA2F]/30 hover:border-[#F3BA2F] text-[#F3BA2F]'
                                    }`}
                            >
                                {isConfirming || status === 'generating' ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    method === 'crypto' ? <ArrowUpCircle size={20} /> : <QrCode size={20} />
                                )}
                                {isConfirming ? 'Confirmando...' : status === 'generating' ? 'Generando QR...' : 'Depositar en Casino'}
                            </motion.button>
                        </>
                    )}

                    <AnimatePresence>
                        {status === 'success' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-neon-green text-xs font-bold bg-neon-green/10 p-2 rounded-lg border border-neon-green/20"
                            >
                                <CheckCircle2 size={14} /> Depósito confirmado y acreditado
                            </motion.div>
                        )}
                        {(connectError || sendError) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 text-neon-pink text-xs font-bold bg-neon-pink/10 p-2 rounded-lg border border-neon-pink/20"
                            >
                                <AlertCircle size={14} /> {connectError?.message || sendError?.message || 'Error en la transacción'}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
};

export default WalletManager;
