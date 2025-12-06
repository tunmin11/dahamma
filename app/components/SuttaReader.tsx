"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SuttaText } from "../data/sutta-texts";

interface SuttaReaderProps {
    text: SuttaText;
    onClose?: () => void;
    currentTime?: number;
    duration?: number;
}

export default function SuttaReader({ text, onClose, currentTime = 0, duration = 0 }: SuttaReaderProps) {
    const [activeTab, setActiveTab] = useState<"pali" | "myanmar">("pali");
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const content = activeTab === "pali" ? text.pali : text.myanmar;

    useEffect(() => {
        if (!scrollContainerRef.current || !contentRef.current) return;

        const config = text.config || { scrollStart: 0, scrollDuration: duration };
        const scrollStart = config.scrollStart || 0;
        const totalDuration = config.scrollDuration || duration;

        // Only scroll if we are participating in the scrolling window
        if (currentTime < scrollStart) return;

        const activeTime = currentTime - scrollStart;
        const effectiveDuration = Math.max(1, totalDuration - scrollStart);
        const progress = Math.min(1, Math.max(0, activeTime / effectiveDuration));

        const containerHeight = scrollContainerRef.current.clientHeight;
        const scrollHeight = scrollContainerRef.current.scrollHeight;
        const maxScroll = scrollHeight - containerHeight;

        if (maxScroll > 0) {
            const targetScroll = maxScroll * progress;
            // Smoothly update scroll position (direct assignment is usually fine for linear updates)
            scrollContainerRef.current.scrollTop = targetScroll;
        }

    }, [currentTime, duration, text.config]);

    return (
        <div className="flex flex-col h-full bg-black/95 backdrop-blur-2xl overflow-hidden">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
                <div className="flex bg-black/40 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab("pali")}
                        className={`
              px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${activeTab === "pali"
                                ? "bg-orange-600/80 text-white shadow-lg"
                                : "text-white/60 hover:text-white"
                            }
            `}
                    >
                        Pali
                    </button>
                    <button
                        onClick={() => setActiveTab("myanmar")}
                        className={`
              px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${activeTab === "myanmar"
                                ? "bg-orange-600/80 text-white shadow-lg"
                                : "text-white/60 hover:text-white"
                            }
            `}
                    >
                        Myanmar
                    </button>
                </div>

                {onClose && (
                    <button onClick={onClose} className="text-white/40 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all">
                        <span className="sr-only">Close</span>
                        <ChevronDown size={24} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 scroll-smooth"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-lg leading-loose text-orange-50 font-serif text-center whitespace-pre-wrap pb-[50vh]"
                        ref={contentRef}
                    >
                        {content as string}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
