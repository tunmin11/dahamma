"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, ChevronUp, ChevronDown } from "lucide-react";
import { Sutta } from "../data/suttas";
import { motion, AnimatePresence } from "framer-motion";

interface AudioPlayerProps {
    currentSutta: Sutta | null;
    onNext: () => void;
    onPrev: () => void;
    isPlaying: boolean;
    onPlayPause: () => void;
    onToggleReader: () => void;
    isReaderOpen: boolean;
    onTimeUpdate?: (time: number, duration: number) => void;
}

export default function AudioPlayer({
    currentSutta,
    onNext,
    onPrev,
    isPlaying,
    onPlayPause,
    onToggleReader,
    isReaderOpen,
    onTimeUpdate
}: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentSutta]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime;
            const dur = audioRef.current.duration || 0;
            setProgress(time);
            setDuration(dur);
            if (onTimeUpdate) onTimeUpdate(time, dur);
        }
    };

    const handleEnded = () => {
        onNext();
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = Number(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    };

    if (!currentSutta) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/10 p-4 pb-8 z-50 shadow-2xl"
            >
                <audio
                    ref={audioRef}
                    src={`/suttas/${currentSutta.filename}`}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    onLoadedMetadata={handleTimeUpdate}
                />

                {/* Toggle Reader Button - Centered above player or integrated? */}
                <button
                    onClick={onToggleReader}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full p-1 text-white/80 hover:bg-white/20 transition-all z-10"
                >
                    {isReaderOpen ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </button>

                <div className="max-w-md mx-auto space-y-4 pt-2">
                    <div className="text-center cursor-pointer" onClick={onToggleReader}>
                        <h3 className="text-lg font-bold text-white mb-1 truncate">{currentSutta.title}</h3>
                        <p className="text-xs text-white/50 uppercase tracking-widest">
                            {isReaderOpen ? "Swipe down to close" : "Tap for Lyrics"}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <input
                            type="range"
                            min={0}
                            max={duration || 100}
                            value={progress}
                            onChange={handleSeek}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                        <div className="flex justify-between text-xs text-white/50 font-mono">
                            <span>{formatTime(progress)}</span>
                            <span>{formatTime(duration)}</span>
                        </div>
                    </div>

                    <div className="flex justify-center items-center gap-8">
                        <button
                            onClick={onPrev}
                            className="text-white/70 hover:text-white transition-colors active:scale-95 transform"
                        >
                            <SkipBack size={24} />
                        </button>

                        <button
                            onClick={onPlayPause}
                            className="w-14 h-14 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all active:scale-90 transform shadow-lg border border-white/10"
                        >
                            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                        </button>

                        <button
                            onClick={onNext}
                            className="text-white/70 hover:text-white transition-colors active:scale-95 transform"
                        >
                            <SkipForward size={24} />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
