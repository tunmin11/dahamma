"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { phayarShitKhoe } from "../data/texts/phayar-shit-khoe";

export default function PhayarShitKhoePage() {
    const verses = phayarShitKhoe.split(/\n\n/);

    return (
        <div className="min-h-screen text-gray-800 p-4 sm:p-6 md:p-8 max-w-2xl mx-auto">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mb-8 pt-4 text-center relative"
            >
                <Link href="/library" className="absolute left-0 top-6 text-gray-400 hover:text-black transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <span className="text-xs font-bold tracking-[0.2em] text-orange-900/60 uppercase">
                    Vajira Panjaram
                </span>
                <h1 className="text-3xl font-bold mt-2 bg-gradient-to-r from-orange-800 to-amber-700 bg-clip-text text-transparent leading-relaxed py-1">
                    ဘုရားရှိခိုး
                </h1>
                <div className="h-1 w-12 bg-orange-200 mx-auto mt-4 rounded-full" />
            </motion.header>

            <main className="pb-32">
                <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm border border-stone-100">
                    <div className="space-y-8 text-lg leading-loose text-gray-700 font-medium text-center font-myanmar">
                        {verses.map((verse, index) => (
                            <motion.p
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: index * 0.05 }}
                            >
                                {verse}
                            </motion.p>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
