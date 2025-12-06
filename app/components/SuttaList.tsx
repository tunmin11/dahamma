"use client";

import { Sutta } from "../data/suttas";
import { Play, Pause, Music } from "lucide-react";
import { motion } from "framer-motion";

interface SuttaListProps {
    suttas: Sutta[];
    currentSutta: Sutta | null;
    isPlaying: boolean;
    onSelect: (sutta: Sutta) => void;
}

export default function SuttaList({ suttas, currentSutta, isPlaying, onSelect }: SuttaListProps) {
    return (
        <div className="space-y-3 pb-32">
            {suttas.map((sutta, index) => {
                const isCurrent = currentSutta?.id === sutta.id;

                return (
                    <motion.div
                        key={sutta.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => onSelect(sutta)}
                        className={`
              relative overflow-hidden group cursor-pointer
              p-4 rounded-2xl border transition-all duration-300
              ${isCurrent
                                ? "bg-white/20 border-white/30 shadow-lg"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }
            `}
                    >
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-4">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${isCurrent ? "bg-white text-orange-900" : "bg-white/10 text-white/50"}
                `}>
                                    {isCurrent && isPlaying ? (
                                        <Pause size={16} fill="currentColor" />
                                    ) : (
                                        <span className="font-mono text-sm">{index + 1}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-semibold ${isCurrent ? "text-white" : "text-white/80"}`}>
                                        {sutta.title}
                                    </h3>
                                    <p className="text-xs text-white/40 mt-0.5">MP3 Audio</p>
                                </div>
                            </div>

                            {isCurrent && (
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-0.5 items-end h-4">
                                        {[1, 2, 3].map(i => (
                                            <motion.div
                                                key={i}
                                                animate={{ height: isPlaying ? [4, 16, 8, 12, 4] : 4 }}
                                                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                                                className="w-1 bg-white rounded-full"
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
