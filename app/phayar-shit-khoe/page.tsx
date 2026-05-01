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
                <Link href="/library" className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-black text-gray-500 hover:text-gray-800 bg-white/70 rounded-full px-3 py-1.5 border border-gray-100 transition-all">
                    <ChevronLeft size={16} />
                    Back
                </Link>
                <span className="text-xs font-black tracking-[0.2em] text-gray-400 uppercase">
                    Vajira Panjaram
                </span>
                <h1 className="text-3xl font-black mt-2 text-gray-800 leading-relaxed py-1">
                    ဘုရားရှိခိုး
                </h1>
            </motion.header>

            <div className="lg:grid lg:grid-cols-[260px,1fr] lg:gap-12 lg:items-start max-w-7xl mx-auto">
                {/* Desktop Sidebar */}
                <aside className="hidden lg:block sticky top-8 h-[calc(100vh-4rem)] overflow-y-auto pr-4">
                    <nav className="space-y-0.5">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-4 px-3">
                            Contents
                        </h3>
                        {phayarShitKhoe.map((section, index) => (
                            <a
                                key={index}
                                href={`#section-${index}`}
                                className="block px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors truncate"
                            >
                                {section.title}
                            </a>
                        ))}
                    </nav>
                </aside>

                <main className="pb-32">
                    <div className="space-y-4">
                        {phayarShitKhoe.map((section, index) => (
                            <motion.div
                                key={index}
                                id={`section-${index}`}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ delay: index * 0.03 }}
                                className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 scroll-mt-24"
                            >
                                <h2 className="text-lg font-black text-gray-800 mb-4 text-center">
                                    {section.title}
                                </h2>
                                <p className="text-lg pt-2 leading-loose text-center text-gray-600 whitespace-pre-line">
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
