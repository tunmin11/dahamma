"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export default function LibraryPage() {
    const books = [
        {
            id: "paritta",
            href: "/paritta",
            title: "Paritta Pali",
            subtitle: "The 11 Major Suttas",
            nativeTitle: "ပရိတ်ကြီး ၁၁ သုတ်",
            color: "from-orange-500 to-amber-600",
            coverImage: "/covers/paritta.png",
        },
        {
            id: "patthana",
            href: "/pahtan",
            title: "Patthana Pali",
            subtitle: "Conditional Relations",
            nativeTitle: "ပဋ္ဌာန်းပါဠိတော်",
            color: "from-amber-700 to-red-900",
            coverImage: "/covers/patthana.png",
        },
        {
            id: "phayar-shit-khoe",
            href: "/phayar-shit-khoe",
            title: "Phayar Shit Khoe",
            subtitle: "Protective Verses",
            nativeTitle: "ဘုရားရှိခိုး",
            color: "from-emerald-700 to-teal-900",
            coverImage: "/covers/PhayarShitKhoe.png",
        },
        // Add other text collections here in the future
    ];

    return (
        <div className="min-h-screen text-gray-800 p-6 md:p-8 max-w-6xl mx-auto flex flex-col">
            <motion.header
                className="mt-4 mb-8 text-center relative"
            >
                <Link href="/" className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-black text-gray-500 hover:text-gray-800 bg-white/70 rounded-full px-3 py-1.5 border border-gray-100 transition-all">
                    <ChevronLeft size={16} />
                    Back
                </Link>
                <span className="text-xs font-black tracking-[0.3em] text-gray-400 uppercase">
                    Archive
                </span>
                <h1 className="text-3xl md:text-4xl font-black mt-2 text-gray-800">
                    Dhamma Library
                </h1>
            </motion.header>

            <main className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 justify-items-center">
                    {books.map((book, index) => (
                        <Link key={book.id} href={book.href}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative flex flex-col items-center cursor-pointer"
                            >
                                {/* Book Cover Container */}
                                <div className="relative w-48 aspect-[2/3] md:w-56 rounded-r-lg rounded-l-sm transition-all duration-300">
                                    {/* Spine Effect */}
                                    <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-sm mix-blend-overlay" />

                                    {/* Cover Image */}
                                    <img
                                        src={book.coverImage}
                                        alt={book.title}
                                        className="w-full h-full object-cover rounded-r-lg rounded-l-sm"
                                    />

                                    {/* Shine/Lighting */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/5 to-white/10 rounded-r-lg pointer-events-none mix-blend-overlay" />
                                </div>

                                {/* Metadata below book */}
                                <div className="mt-3 text-center">
                                    <h2 className="text-base font-black text-gray-800 mb-0.5">
                                        {book.nativeTitle}
                                    </h2>
                                    <p className="text-xs text-gray-400">
                                        {book.title}
                                    </p>
                                </div>
                            </motion.div>
                        </Link>
                    ))}

                </div>
            </main>
        </div>
    );
}
