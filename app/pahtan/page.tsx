"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Minus } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import PahtanData from "../data/pahtan";

export default function PahtanPage() {
    const [fontSize, setFontSize] = useState(20); // Base font size in px

    return (
        <div className="min-h-screen bg-[#f8f5f2] text-gray-800 font-sans">
            <div className="w-full px-6 py-8 md:py-12">
                {/* Header */}
                <motion.header
                    className="mb-12 text-center relative"
                >
                    <Link
                        href="/library"
                        className="absolute left-0 top-1 p-2 -ml-2 text-gray-400 hover:text-amber-800 transition-colors rounded-full hover:bg-amber-100/50"
                    >
                        <ChevronLeft size={24} />
                    </Link>
                    <span className="text-xs font-bold tracking-[0.2em] text-amber-900/40 uppercase block mb-2">
                        Canonical Text
                    </span>
                    <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-800 to-orange-700 bg-clip-text text-transparent pb-1">
                        Maha Patthana
                    </h1>
                    <p className="text-sm font-medium text-amber-900/60 mt-1">
                        ပဋ္ဌာန်းပါဠိတော်
                    </p>
                    <div className="h-1 w-16 bg-gradient-to-r from-amber-200 to-orange-200 mx-auto mt-6 rounded-full" />
                </motion.header>

                {/* Content */}
                <main className="space-y-8 bg-white/80">
                    {PahtanData.map((section, index) => (
                        <motion.div
                            key={index}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 md:p-8 hover:shadow-md transition-shadow duration-300"
                        >
                            {section.header && (
                                <h2 className="text-xl text-center md:text-2xl font-bold text-amber-900 mb-6 font-serif leading-relaxed">
                                    {section.header}
                                </h2>
                            )}
                            <div
                                className="text-lg md:text-xl text-center text-gray-700 font-medium whitespace-pre-line"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    lineHeight: '1.8'
                                }}
                            >
                                {section.content.replaceAll("။", "။\n")}
                            </div>
                        </motion.div>
                    ))}
                </main>


                {/* Footer decoration */}
                <div className="mt-16 text-center opacity-40 pb-24">
                    <p className="text-2xl text-amber-800">☸</p>
                </div>
            </div>

            {/* Auto Scroll & Text Controls */}
            <AutoScrollControls fontSize={fontSize} setFontSize={setFontSize} />
        </div>
    );
}

function AutoScrollControls({
    fontSize,
    setFontSize
}: {
    fontSize: number;
    setFontSize: (size: number | ((prev: number) => number)) => void
}) {
    const [isScrolling, setIsScrolling] = useState(false);
    const [speed, setSpeed] = useState(1); // 1 = Slow, 1.5 = Medium-Slow, 2 = Medium, 3 = Fast
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);

    const adjustFontSize = (delta: number) => {
        setFontSize(prev => Math.min(Math.max(prev + delta, 14), 48));
    };

    // Use a ref to accumulate fractional scroll amounts
    const scrollAccumulator = useRef(0);

    useEffect(() => {
        let animationFrameId: number;

        const scroll = () => {
            if (isScrolling) {
                // Adjust scroll amount based on speed
                // Speed 1: ~0.5px/frame
                // Speed 1.5: ~0.75px/frame
                // Speed 2: ~1.0px/frame
                // Speed 3: ~2.0px/frame
                const scrollSpeed = speed === 1 ? 0.3 : speed === 1.5 ? 0.7 : speed === 2 ? 1.5 : 2;

                // Add to accumulator
                scrollAccumulator.current += scrollSpeed;

                // Only scroll when we have at least 1 pixel to scroll
                if (scrollAccumulator.current >= 1) {
                    const pixelsToScroll = Math.floor(scrollAccumulator.current);
                    window.scrollBy(0, pixelsToScroll);
                    scrollAccumulator.current -= pixelsToScroll;
                }

                animationFrameId = requestAnimationFrame(scroll);
            }
        };

        if (isScrolling) {
            animationFrameId = requestAnimationFrame(scroll);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isScrolling, speed]);

    const speeds = [1, 1.5, 2, 3];

    return (
        <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed bottom-6 inset-x-0 flex justify-center z-50 pointer-events-none"
        >
            <div className="bg-white/90 backdrop-blur-md shadow-lg border border-orange-100 rounded-full px-6 py-3 flex items-center gap-6 pointer-events-auto relative">
                <button
                    onClick={() => setIsScrolling(!isScrolling)}
                    className="flex items-center gap-2 text-amber-900 hover:text-amber-700 transition-colors"
                >
                    {isScrolling ? (
                        <>
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                            <span className="font-bold">Pause</span>
                        </>
                    ) : (
                        <>
                            <div className="w-0 h-0 border-l-[12px] border-l-amber-800 border-y-[8px] border-y-transparent ml-1" />
                            <span className="font-bold ml-1">Auto Scroll</span>
                        </>
                    )}
                </button>

                <div className="h-6 w-px bg-gray-200" />

                <div className="relative">
                    <button
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors font-medium text-sm text-gray-600"
                    >
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Speed</span>
                        <span className="text-amber-900 font-bold min-w-[2.5em] text-center">{speed}x</span>
                        <ChevronLeft
                            size={16}
                            className={`transform transition-transform duration-200 ${showSpeedMenu ? "rotate-90" : "-rotate-90"}`}
                        />
                    </button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {showSpeedMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white shadow-xl border border-gray-100 rounded-xl overflow-hidden min-w-[120px]"
                            >
                                <div className="p-1 flex flex-col gap-0.5">
                                    {speeds.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => {
                                                setSpeed(s);
                                                setShowSpeedMenu(false);
                                            }}
                                            className={`flex items-center justify-between w-full px-4 py-2 text-sm font-medium rounded-lg transition-colors ${speed === s
                                                ? "bg-amber-50 text-amber-900"
                                                : "text-gray-600 hover:bg-gray-50"
                                                }`}
                                        >
                                            <span>{s}x</span>
                                            {speed === s && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="h-6 w-px bg-gray-200" />

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => adjustFontSize(-2)}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-amber-900 transition-colors"
                        title="Decrease size"
                    >
                        <Minus size={16} />
                    </button>

                    <div className="flex flex-col items-center min-w-[32px]">
                        <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-0.5">Size</span>
                        <span className="text-xs font-bold text-amber-900 leading-none">{fontSize}</span>
                    </div>

                    <button
                        onClick={() => adjustFontSize(2)}
                        className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-amber-900 transition-colors"
                        title="Increase size"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
