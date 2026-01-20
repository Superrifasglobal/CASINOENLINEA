import React from 'react';
import { Users, TrendingUp, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const statsData = [
    { label: 'Usuarios Activos', value: '1,284', icon: Users, color: '#b026ff', trend: '+12%' },
    { label: 'Volumen de Apuestas', value: '$45,290', icon: TrendingUp, color: '#00f3ff', trend: '+8%' },
    { label: 'Ganancia Neta (GGR)', value: '$12,450', icon: DollarSign, color: '#00ff9d', trend: '+15%' },
];

const chartData = [
    { name: 'Lun', value: 4000 },
    { name: 'Mar', value: 3000 },
    { name: 'Mie', value: 5000 },
    { name: 'Jue', value: 4500 },
    { name: 'Vie', value: 6000 },
    { name: 'Sab', value: 8000 },
    { name: 'Dom', value: 7000 },
];

export const AdminStats = () => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statsData.map((stat, i) => (
                <div key={i} className="bg-surface border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500" />
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`p-3 rounded-xl bg-white/5 border border-white/10`} style={{ color: stat.color }}>
                            <stat.icon size={24} />
                        </div>
                        <span className="text-neon-green text-sm font-medium bg-neon-green/10 px-2 py-1 rounded-lg">
                            {stat.trend}
                        </span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{stat.label}</p>
                        <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export const AdminPerformanceChart = () => {
    return (
        <div className="bg-surface border border-white/5 p-8 rounded-2xl mb-8">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold">Rendimiento Semanal</h2>
                <div className="flex gap-2">
                    <span className="flex items-center gap-2 text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                        <div className="w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_5px_#b026ff]"></div>
                        GGR Mensual
                    </span>
                </div>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#b026ff" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#b026ff" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#666', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#121212', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#b026ff"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValue)"
                            dot={{ r: 4, fill: '#b026ff', strokeWidth: 2, stroke: '#121212' }}
                            activeDot={{ r: 6, shadow: '0 0 10px #b026ff' }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
