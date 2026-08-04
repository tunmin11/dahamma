"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";

interface NawinJourneyCompleteProps {
    journeyCount: number;
    onStartNew: () => void;
}

export default function NawinJourneyComplete({ journeyCount, onStartNew }: NawinJourneyCompleteProps) {
    return (
        <div className="w-full max-w-md mx-auto px-4 mt-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
            >
                <div className="bg-gray-900 px-8 pt-10 pb-8 text-center">
                    <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-5 border-b-4 border-white/60">
                        <Trophy size={44} className="text-gray-800" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">JOURNEY COMPLETE</h2>
                    <p className="text-gray-400 text-sm mt-1 font-semibold">81 days · 9 levels · fully chanted</p>
                </div>
                <div className="p-6 text-center">
                    <p className="text-gray-500 text-sm mb-6 flex items-center justify-center gap-1.5">
                        <Sparkles size={14} className="text-gray-400" />
                        You&apos;ve completed {journeyCount} journey{journeyCount > 1 ? "s" : ""}
                    </p>
                    <button
                        onClick={onStartNew}
                        className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white bg-gray-900 border-b-4 border-gray-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        Start New Journey
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
