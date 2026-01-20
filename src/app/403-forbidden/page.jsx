import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Home } from 'lucide-react';

export default function ForbiddenPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 relative overflow-hidden">
            {/* Red Glow Background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-lg text-center space-y-6">
                <div className="flex justify-center mb-4">
                    <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)]">
                        <AlertTriangle className="w-10 h-10 text-red-500" />
                    </div>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-red-400 to-red-700">
                    ACCESS DENIED
                </h1>

                <p className="text-gray-400 text-lg">
                    You do not have the necessary security clearance to view this area.
                    This attempt has been logged.
                </p>

                <div className="pt-4">
                    <Link
                        href="/lobby"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 transition-all text-white font-medium"
                    >
                        <Home className="w-4 h-4" />
                        Return to Lobby
                    </Link>
                </div>
            </div>
        </div>
    );
}
