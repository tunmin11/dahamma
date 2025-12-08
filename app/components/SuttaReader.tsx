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
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const [scrollSpeed, setScrollSpeed] = useState(1);

    const content = activeTab === "pali" ? text.pali : text.myanmar;

    useEffect(() => {
        if (!scrollContainerRef.current || !contentRef.current) return;
        if (!isAutoScroll) return;

        const config = text.config || { scrollStart: 0, scrollDuration: duration };
        const scrollStart = config.scrollStart || 0;
        const baseDuration = config.scrollDuration || duration;

        // Adjust duration based on speed (higher speed = lower duration)
        const effectiveDuration = Math.max(1, baseDuration / scrollSpeed);

        // Only scroll if we are participating in the scrolling window
        if (currentTime < scrollStart) return;

        const activeTime = currentTime - scrollStart;
        const progress = Math.min(1, Math.max(0, activeTime / effectiveDuration));

        const containerHeight = scrollContainerRef.current.clientHeight;
        const scrollHeight = scrollContainerRef.current.scrollHeight;
        const maxScroll = scrollHeight - containerHeight;

        if (maxScroll > 0) {
            const targetScroll = maxScroll * progress;
            scrollContainerRef.current.scrollTop = targetScroll;
        }

    }, [currentTime, duration, text.config, isAutoScroll, scrollSpeed]);

    const handleSpeedClick = () => {
        const speeds = [0.5, 1, 2, 5];
        const currentIndex = speeds.indexOf(scrollSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        setScrollSpeed(speeds[nextIndex]);
    };

    return (
        <div className="flex flex-col h-full bg-white/95 backdrop-blur-2xl overflow-hidden shadow-2xl rounded-t-3xl">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white/50 z-10">
                <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                    <button
                        onClick={() => setActiveTab("pali")}
                        className={`
              px-4 py-1.5 rounded-md text-sm font-medium transition-all
              ${activeTab === "pali"
                                ? "bg-white text-orange-700 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-900"
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
                                ? "bg-white text-orange-700 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-900"
                            }
            `}
                    >
                        Myanmar
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsAutoScroll(!isAutoScroll)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider border transition-all ${isAutoScroll ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200"}`}
                    >
                        {isAutoScroll ? "Auto: On" : "Auto: Off"}
                    </button>

                    <button
                        onClick={handleSpeedClick}
                        className="px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200 transition-all w-[4.5rem]"
                    >
                        {scrollSpeed}x
                    </button>

                    {onClose && (
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-all ml-2">
                            <span className="sr-only">Close</span>
                            <ChevronDown size={24} />
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-6 scroll-smooth bg-[#F9F7F5]"
            >
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="text-lg leading-loose text-gray-800 font-serif text-center whitespace-pre-wrap pb-[50vh] pt-10"
                        ref={contentRef}
                    >
                        {content as string}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
