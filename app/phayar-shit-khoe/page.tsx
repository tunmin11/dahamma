"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { phayarShitKhoe } from "../data/texts/phayar-shit-khoe";

export default function PhayarShitKhoePage() {
    return (
        <div className="min-h-screen text-gray-800 p-4 sm:p-6 md:p-8 max-w-2xl lg:max-w-7xl mx-auto">
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

            <div className="lg:grid lg:grid-cols-[300px,1fr] lg:gap-12 lg:items-start max-w-7xl mx-auto">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-orange-200 scrollbar-track-transparent">
                    <nav className="space-y-1">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 px-3">
                            Contents
                        </h3>
                        {phayarShitKhoe.map((section, index) => (
                            <a
                                key={index}
                                href={`#section-${index}`}
                                className="block px-3 py-2 text-sm text-gray-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors font-myanmar truncate"
                            >
                                {section.title}
                            </a>
                        ))}
                    </nav>
                </aside>

                <main className="pb-32">
                    <div className="space-y-6">
                        {phayarShitKhoe.map((section, index) => (
                            <motion.div
                                key={index}
                                id={`section-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-sm border border-stone-100 scroll-mt-24"
                            >
                                <h2 className="text-xl font-bold text-amber-800 mb-4 text-center font-myanmar">
                                    {section.title}
                                </h2>
                                <p className="text-lg pt-4 leading-loose text-center text-gray-700 font-medium font-myanmar whitespace-pre-line">
                                    {section.content}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
