"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Book, Stars } from "lucide-react";
import InstallPrompt from "./components/InstallPrompt";

export default function Home() {
  return (
    <div className="min-h-screen text-white p-6 md:p-8 max-w-4xl mx-auto flex flex-col justify-center">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mb-12 text-center"
      >
        <span className="text-xs font-bold tracking-[0.3em] text-orange-200/60 uppercase">
          Sayadaw U Vicittasarabhivamsa
        </span>
        <h1 className="text-4xl md:text-5xl font-bold mt-3 bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 bg-clip-text text-transparent">
          Dhamma App
        </h1>
        <p className="text-white/40 mt-4 text-sm font-light tracking-wide">
          Choose a path to begin
        </p>
      </motion.header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
        {/* Library Card */}
        <Link href="/library">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-orange-950/40 to-black border border-orange-500/20 rounded-2xl p-8 flex flex-col items-center text-center h-full hover:border-orange-500/40 transition-colors shadow-2xl shadow-orange-900/10"
          >
            <div className="p-4 rounded-full bg-orange-500/10 text-orange-400 mb-6 group-hover:bg-orange-500/20 transition-colors">
              <Book size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Library</h2>
            <p className="text-white/40 text-sm">
              Access the complete collection of Suttas, Parittas, and Chants.
            </p>
          </motion.div>
        </Link>

        {/* Nawin Card */}
        <Link href="/nawin">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="group relative bg-gradient-to-br from-blue-950/40 to-black border border-blue-500/20 rounded-2xl p-8 flex flex-col items-center text-center h-full hover:border-blue-500/40 transition-colors shadow-2xl shadow-blue-900/10"
          >
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 mb-6 group-hover:bg-blue-500/20 transition-colors">
              <Stars size={40} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ko Nawin</h2>
            <p className="text-white/40 text-sm">
              Special rituals and 9 Attributes for protection and fulfilling wishes.
            </p>
          </motion.div>
        </Link>
      </main>

      <footer className="mt-16 text-center text-white/20 text-xs py-8">
        <p>© {new Date().getFullYear()} Dhamma Project</p>
      </footer>

      <InstallPrompt />
    </div>
  );
}
