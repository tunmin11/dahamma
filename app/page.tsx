"use client";

import { useState } from "react";
import { suttas, Sutta } from "./data/suttas";
import SuttaList from "./components/SuttaList";
import AudioPlayer from "./components/AudioPlayer";
import SuttaReader from "./components/SuttaReader";
import InstallPrompt from "./components/InstallPrompt";
import { getSuttaText } from "./data/sutta-texts";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp } from "lucide-react";

export default function Home() {
  const [currentSutta, setCurrentSutta] = useState<Sutta | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReaderOpen, setIsReaderOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Auto-open reader when playing a different sutta? optional.
  // For now let user toggle it.

  const handleSelectSutta = (sutta: Sutta) => {
    if (currentSutta?.id === sutta.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSutta(sutta);
      setIsPlaying(true);
      setCurrentTime(0); // Reset time for new track
    }
  };

  const handleNext = () => {
    if (!currentSutta) return;
    const currentIndex = suttas.findIndex((s) => s.id === currentSutta.id);
    const nextIndex = (currentIndex + 1) % suttas.length;
    setCurrentSutta(suttas[nextIndex]);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handlePrev = () => {
    if (!currentSutta) return;
    const currentIndex = suttas.findIndex((s) => s.id === currentSutta.id);
    const prevIndex = (currentIndex - 1 + suttas.length) % suttas.length;
    setCurrentSutta(suttas[prevIndex]);
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-8 pt-8 text-center"
      >
        <span className="text-xs font-bold tracking-[0.2em] text-orange-200/60 uppercase">
          Myanmar Recitation
        </span>
        <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-orange-100 to-orange-50 bg-clip-text text-transparent">
          Paritta Pali
        </h1>
        <div className="h-1 w-12 bg-orange-300/30 mx-auto mt-4 rounded-full" />
      </motion.header>

      <main className="pb-32">
        <SuttaList
          suttas={suttas}
          currentSutta={currentSutta}
          isPlaying={isPlaying}
          onSelect={handleSelectSutta}
        />
      </main>

      {/* Reader Overlay */}
      <AnimatePresence>
        {isReaderOpen && currentSutta && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-40 flex flex-col"
          >
            <div className="w-full h-full relative z-50">
              <SuttaReader
                text={getSuttaText(currentSutta.id)}
                onClose={() => setIsReaderOpen(false)}
                currentTime={currentTime}
                duration={duration}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AudioPlayer
        currentSutta={currentSutta}
        isPlaying={isPlaying}
        onNext={handleNext}
        onPrev={handlePrev}
        onPlayPause={handlePlayPause}
        onToggleReader={() => setIsReaderOpen(!isReaderOpen)}
        isReaderOpen={isReaderOpen}
        onTimeUpdate={(t, d) => { setCurrentTime(t); setDuration(d); }}
      />
      <InstallPrompt />
    </div>
  );
}
