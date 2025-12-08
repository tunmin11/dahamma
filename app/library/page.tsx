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
            href: "/books/ပဋ္ဌာန်းပါဠိတော်.pdf",
            title: "Patthana Pali",
            subtitle: "Conditional Relations",
            nativeTitle: "ပဋ္ဌာန်းပါဠိတော်",
            color: "from-amber-700 to-red-900",
            coverImage: "/covers/patthana.png",
        },
        // Add other text collections here in the future
    ];

    return (
        <div className="min-h-screen text-gray-800 p-6 md:p-8 max-w-6xl mx-auto flex flex-col">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="mt-4 mb-8 text-center relative"
            >
                <Link href="/" className="absolute left-0 top-2 text-gray-400 hover:text-black transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <span className="text-xs font-bold tracking-[0.3em] text-orange-900/60 uppercase">
                    Archive
                </span>
                <h1 className="text-3xl md:text-4xl font-bold mt-2 bg-gradient-to-br from-orange-800 via-orange-700 to-amber-800 bg-clip-text text-transparent">
                    Dhamma Library
                </h1>
            </motion.header>

            <main className="flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                    {books.map((book, index) => (
                        <Link key={book.id} href={book.href}>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative flex flex-col items-center cursor-pointer"
                            >
                                {/* Book Cover Container */}
                                <div className="relative w-48 aspect-[2/3] md:w-56 rounded-r-lg rounded-l-sm transition-all duration-300 group-hover:shadow-2xl">
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
                                <div className="mt-1 text-center">
                                    <h2 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-amber-800 transition-colors">
                                        {book.nativeTitle}
                                    </h2>
                                    <p className="text-sm text-gray-500 font-medium">
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
