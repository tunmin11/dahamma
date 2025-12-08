"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, RefreshCw } from "lucide-react";
import { NawinAttribute } from "../data/nawin";

interface NawinCounterProps {
    attribute: NawinAttribute;
    onClose: () => void;
    onComplete: () => void;
    initialCount?: number;
}

export default function NawinCounter({ attribute, onClose, onComplete, initialCount = 0 }: NawinCounterProps) {
    const [count, setCount] = useState(initialCount);
    const [isCompleted, setIsCompleted] = useState(false);

    // Sound effect (simple click)
    const playClick = () => {
        // For now, visual feedback only as creating pure Audio elements in SSR/React requires handling.
        // We rely on haptic/visual.
    };

    const handleTap = () => {
        if (isCompleted) return;

        const newCount = count + 1;
        setCount(newCount);
        playClick();

        if (newCount >= attribute.requiredCounts) {
            setIsCompleted(true);
            onComplete();
        }

        // Auto-save logic should be handled by parent or useEffect but for simplicity we assume parent saves on close
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6">
                <button onClick={onClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <div className="text-center">
                    <h2 className={`font-bold text-transparent bg-clip-text bg-gradient-to-r ${attribute.color}`}>
                        {attribute.pali}
                    </h2>
                    <p className="text-white/40 text-xs uppercase tracking-wider">Level {attribute.id}</p>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Main Interaction Area */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                {/* Background pulses */}
                <div className={`absolute inset-0 bg-gradient-to-br ${attribute.color} opacity-5 blur-[100px]`} />

                <AnimatePresence mode="wait">
                    {!isCompleted ? (
                        <motion.button
                            key="counter-btn"
                            whileTap={{ scale: 0.95 }}
                            onClick={handleTap}
                            className={`
                    w-64 h-64 rounded-full 
                    bg-gradient-to-br ${attribute.color} 
                    shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)]
                    flex flex-col items-center justify-center
                    border-4 border-white/10
                    relative overflow-hidden
                    group
                `}
                        >
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />

                            <span className="text-6xl font-bold text-white relative z-10 font-mono">
                                {count}
                            </span>
                            <span className="text-white/60 text-sm mt-2 relative z-10 border-t border-white/20 pt-1">
                                / {attribute.requiredCounts}
                            </span>

                            {/* Progress Fill (Optional simplified visual) */}
                            <div
                                className="absolute bottom-0 left-0 right-0 bg-white/10 transition-all duration-300 ease-out"
                                style={{ height: `${(count / attribute.requiredCounts) * 100}%` }}
                            />
                        </motion.button>
                    ) : (
                        <motion.div
                            key="completed"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${attribute.color} flex items-center justify-center mb-6 shadow-2xl`}>
                                <Check size={48} className="text-white" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">Complete!</h3>
                            <p className="text-white/50 mb-8 max-w-xs text-center">
                                You have successfully fulfilled the attributes of {attribute.pali}.
                            </p>
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-colors"
                            >
                                Continue
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Footer Instructions */}
            {!isCompleted && (
                <div className="p-8 text-center text-white/20 text-sm">
                    Tap the bead to count
                </div>
            )}
        </motion.div>
    );
}
