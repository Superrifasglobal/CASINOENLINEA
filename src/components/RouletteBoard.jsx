import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, TrendingUp } from 'lucide-react';

const CHIP_VALUES = [0.1, 0.5, 1, 5, 25, 100];
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const RouletteBoard = ({ onBetsChange, totalBalance, gameStatus }) => {
    const [selectedChip, setSelectedChip] = useState(1);
    const [bets, setBets] = useState({}); // { betId: amount }
    const [totalBet, setTotalBet] = useState(0);

    const handlePlaceBet = (betId) => {
        if (gameStatus === 'spinning') return;
        if (totalBalance < selectedChip) return;

        const currentBet = bets[betId] || 0;
        const newAmount = currentBet + selectedChip;

        const newBets = { ...bets, [betId]: newAmount };
        setBets(newBets);
        const newTotal = Object.values(newBets).reduce((a, b) => a + b, 0);
        setTotalBet(newTotal);

        if (onBetsChange) onBetsChange(newBets, newTotal);
    };

    const handleClearBets = () => {
        setBets({});
        setTotalBet(0);
        if (onBetsChange) onBetsChange({}, 0);
    };

    const renderCell = (num) => {
        const isRed = RED_NUMBERS.includes(num);
        const colorClass = num === 0 ? 'bg-[#008f51] hover:bg-[#00a85f]' : (isRed ? 'bg-[#c41e3a] hover:bg-[#d42e4a]' : 'bg-[#1a1a1b] hover:bg-[#2a2a2b]');
        const betAmount = bets[num.toString()];

        return (
            <div
                key={num}
                onClick={() => handlePlaceBet(num.toString())}
                className={`relative flex items-center justify-center border border-white/10 h-16 cursor-pointer transition-colors text-xl font-bold ${colorClass}`}
            >
                {num}
                {betAmount > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 rounded-full border-2 border-dashed border-white flex items-center justify-center bg-yellow-500 text-[10px] text-black font-black shadow-lg"
                        >
                            {betAmount >= 1 ? betAmount : betAmount.toFixed(1)}
                        </motion.div>
                    </div>
                )}
            </div>
        );
    };

    // Organized numbers for the 3-row grid
    const rows = [
        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
        [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
        [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
    ];

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 select-none p-4">
            <div className="flex items-start gap-1">
                {/* Zero Cell */}
                <div
                    onClick={() => handlePlaceBet('0')}
                    className="w-16 h-[192px] bg-[#008f51] flex items-center justify-center text-3xl font-black border border-white/20 rounded-l-xl cursor-pointer hover:bg-[#00a85f] transition-colors"
                >
                    0
                    {bets['0'] > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-white flex items-center justify-center bg-yellow-500 text-[10px] text-black font-black">
                                {bets['0']}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex-1 flex flex-col">
                    {/* Numbers Grid */}
                    <div className="grid grid-rows-3 grid-flow-col">
                        {rows.map(row => row.map(num => renderCell(num)))}
                    </div>

                    {/* Bottom Betting Zones (Dozens) */}
                    <div className="grid grid-cols-3 h-12">
                        {['1st 12', '2nd 12', '3rd 12'].map((label, idx) => (
                            <div
                                key={label}
                                onClick={() => handlePlaceBet(`dozen_${idx + 1}`)}
                                className="border border-white/10 flex items-center justify-center text-xs font-bold bg-[#1a1a1b] hover:bg-white/5 cursor-pointer uppercase tracking-widest relative"
                            >
                                {label}
                                {bets[`dozen_${idx + 1}`] > 0 && (
                                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                        <div className="w-6 h-6 rounded-full bg-yellow-400 border border-white text-[8px] text-black flex items-center justify-center font-bold">
                                            {bets[`dozen_${idx + 1}`]}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Outside Bets Row */}
                    <div className="grid grid-cols-6 h-12">
                        {[
                            { id: 'low', label: '1-18' },
                            { id: 'even', label: 'EVEN' },
                            { id: 'red', label: '', icon: <div className="w-6 h-4 bg-red-600 rotate-45 transform" /> },
                            { id: 'black', label: '', icon: <div className="w-6 h-4 bg-black rotate-45 transform" /> },
                            { id: 'odd', label: 'ODD' },
                            { id: 'high', label: '19-36' }
                        ].map((bet) => (
                            <div
                                key={bet.id}
                                onClick={() => handlePlaceBet(bet.id)}
                                className="border border-white/10 flex items-center justify-center text-xs font-bold bg-[#1a1a1b] hover:bg-white/5 cursor-pointer relative"
                            >
                                {bet.label || bet.icon}
                                {bets[bet.id] > 0 && (
                                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                                        <div className="w-6 h-6 rounded-full bg-yellow-400 border border-white text-[8px] text-black flex items-center justify-center font-bold">
                                            {bets[bet.id]}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2 to 1 Columns */}
                <div className="flex flex-col h-[192px]">
                    {[1, 2, 3].map(col => (
                        <div
                            key={col}
                            onClick={() => handlePlaceBet(`column_${col}`)}
                            className="w-16 flex-1 flex items-center justify-center text-[10px] font-bold border border-white/10 bg-[#1a1a1b] hover:bg-white/5 cursor-pointer uppercase tracking-tight relative"
                        >
                            2 TO 1
                            {bets[`column_${col}`] > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-6 h-6 rounded-full bg-yellow-400 border border-white text-[8px] text-black flex items-center justify-center font-bold">
                                        {bets[`column_${col}`]}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Controls / Chips */}
            <div className="flex items-center justify-between mt-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-4 items-center">
                    <button
                        onClick={handleClearBets}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all transition-colors uppercase text-[10px] font-bold tracking-widest border border-white/5"
                    >
                        <RotateCcw size={14} /> Deshacer
                    </button>
                    <div className="h-8 w-px bg-white/10" />
                    <div className="flex gap-2">
                        {CHIP_VALUES.map(value => (
                            <button
                                key={value}
                                onClick={() => setSelectedChip(value)}
                                className={`
                                    w-12 h-12 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] font-black transition-all transform
                                    ${selectedChip === value ? 'scale-110 border-white bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,243,0.4)]' : 'border-white/20 bg-white/5 text-white/50 hover:bg-white/10'}
                                `}
                            >
                                ${value >= 1 ? value : value.toFixed(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex gap-8">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Apuesta Total</span>
                        <span className="text-xl font-black text-neon-green">${totalBet.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end border-l border-white/10 pl-8">
                        <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Saldo Disponible</span>
                        <span className="text-xl font-black text-white">${totalBalance.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RouletteBoard;
