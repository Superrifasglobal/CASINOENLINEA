import React from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

const GameCard = ({ title, provider, image }) => {
    return (
        <motion.div
            whileHover={{ y: -10 }}
            className="group relative rounded-xl overflow-hidden cursor-pointer"
        >
            <div className="absolute inset-0 bg-neon-green/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />

            <div className="relative aspect-[3/4] w-full bg-surface border border-white/5 rounded-xl overflow-hidden group-hover:border-neon-green/50 transition-colors duration-300">
                {image ? (
                    <div className="w-full h-full relative">
                        <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-surface to-surfaceHighlight group-hover:from-surfaceHighlight group-hover:to-neon-green/20 transition-all">
                        <span className="grayscale group-hover:grayscale-0 transition-all duration-300">🎲</span>
                    </div>
                )}

                {/* Hover Action */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
                    <button className="bg-neon-green text-black font-bold p-4 rounded-full shadow-[0_0_20px_#00ff9d] transform scale-50 group-hover:scale-100 transition-all duration-300 hover:bg-white hover:text-neon-green">
                        <Play size={24} fill="currentColor" />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-4 z-10 transform transition-transform duration-300 group-hover:translate-y-[-10px]">
                    <p className="text-neon-green text-xs font-bold uppercase tracking-wider mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
                        {provider || 'NEXBET'}
                    </p>
                    <h3 className="font-bold text-white text-lg leading-tight group-hover:text-neon-green transition-colors">
                        {title || 'Unknown Game'}
                    </h3>
                </div>
            </div>
        </motion.div>
    );
};

export default GameCard;

