import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, Users, ShieldAlert } from 'lucide-react';

export default function RouletteAdmin() {
    const [rtp, setRtp] = useState(0.95);
    const [history, setHistory] = useState([]);
    const [liveCount, setLiveCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        fetchHistory();
        fetchLiveCount();
        const interval = setInterval(fetchLiveCount, 5000); // Poll live count
        return () => clearInterval(interval);
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/admin/roulette/history', {
                headers: { 'Authorization': 'Bearer ADMIN_TOKEN' }
            });
            const data = await res.json();
            if (data.history) setHistory(data.history);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchLiveCount = async () => {
        try {
            const res = await fetch('/api/admin/system/live', {
                headers: { 'Authorization': 'Bearer ADMIN_TOKEN' }
            });
            const data = await res.json();
            if (data.count !== undefined) setLiveCount(data.count);
        } catch (e) { }
    };

    const updateRTP = async () => {
        setLoading(true);
        try {
            await fetch('/api/admin/roulette/rtp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ADMIN_TOKEN'
                },
                body: JSON.stringify({ rtp })
            });
            alert('RTP Updated');
        } catch (e) {
            alert('Error updating RTP');
        }
        setLoading(false);
    };

    return (
        <div className="space-y-6 text-white p-6">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Roulette Administration
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* RTP Control */}
                <div className="bg-gray-900/50 border border-white/10 p-6 rounded-xl backdrop-blur-md">
                    <div className="flex items-center gap-3 mb-4">
                        <Settings className="text-purple-400" />
                        <h2 className="text-xl font-semibold">House Edge & RTP</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>House Win: {((1 - rtp) * 100).toFixed(1)}%</span>
                            <span>Player Return: {(rtp * 100).toFixed(1)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0.90"
                            max="0.99"
                            step="0.01"
                            value={rtp}
                            onChange={(e) => setRtp(parseFloat(e.target.value))}
                            className="w-full accent-purple-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <button
                            onClick={updateRTP}
                            disabled={loading}
                            className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold transition-all disabled:opacity-50"
                        >
                            {loading ? 'Updating...' : 'Apply Details'}
                        </button>
                    </div>
                </div>

                {/* Live Monitor */}
                <div className="bg-gray-900/50 border border-white/10 p-6 rounded-xl backdrop-blur-md flex flex-col items-center justify-center">
                    <div className="flex items-center gap-3 mb-2 text-green-400">
                        <Users size={32} />
                        <h2 className="text-2xl font-bold">Live Players</h2>
                    </div>
                    <div className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(74,222,128,0.5)]">
                        {liveCount}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Real-time via Cloudflare DO
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-gray-900/50 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <RefreshCw className="text-blue-400" /> Recent Spins
                    </h2>
                    <button onClick={fetchHistory} className="text-sm text-blue-400 hover:text-blue-300">Refresh</button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                            <tr>
                                <th className="p-4">Time</th>
                                <th className="p-4">Result</th>
                                <th className="p-4">Bet</th>
                                <th className="p-4">Payout</th>
                                <th className="p-4">House P/L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {history.map((tx) => {
                                const housePL = tx.amount - tx.payout;
                                return (
                                    <tr key={tx.id} className="hover:bg-white/5">
                                        <td className="p-4 text-gray-400 text-sm">
                                            {new Date(tx.created_at).toLocaleTimeString()}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${tx.status === 'win' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                                                {tx.status === 'win' ? 'PLAYER WIN' : 'HOUSE WIN'}
                                            </span>
                                        </td>
                                        <td className="p-4">${tx.amount}</td>
                                        <td className="p-4">${tx.payout}</td>
                                        <td className={`p-4 font-bold ${housePL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {housePL >= 0 ? '+' : ''}{housePL.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {history.length === 0 && <div className="p-8 text-center text-gray-500">No spin history available.</div>}
                </div>
            </div>
        </div>
    );
}
