"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InstallPrompt() {
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Detect iOS
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

        // Detect Standalone (PWA mode)
        const isStandaloneMode =
            window.matchMedia("(display-mode: standalone)").matches ||
            (window.navigator as any).standalone === true;

        setIsIOS(isIosDevice);
        setIsStandalone(isStandaloneMode);

        // Show prompt only on iOS and NOT in standalone mode
        // Add a small delay so it doesn't pop up instantly
        if (isIosDevice && !isStandaloneMode) {
            const timer = setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!showPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 left-4 right-4 z-50 bg-white/90 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-2xl text-gray-800"
            >
                <button
                    onClick={() => setShowPrompt(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col gap-3 pr-6">
                    <h3 className="font-bold text-orange-600">Install App</h3>
                    <p className="text-sm text-gray-600">
                        Install this app on your iPhone for the best experience.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>1. Tap</span>
                        <Share size={18} className="text-blue-500" />
                        <span>in the toolbar</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>2. Select</span>
                        <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">Add to Home Screen</span>
                    </div>
                </div>

                {/* Pointing Arrow (Optional visual cue) */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/90 rotate-45 border-r border-b border-gray-200 hidden sm:block"></div>
            </motion.div>
        </AnimatePresence>
    );
}
