"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import NawinPath from "../components/NawinPath";

export default function NawinPage() {
    return (
        <div className="min-h-screen text-gray-800 p-0 md:p-4 max-w-lg mx-auto flex flex-col relative">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pt-8 px-6 mb-4 text-center relative z-20"
            >
                <Link href="/" className="absolute left-6 top-10 text-gray-400 hover:text-black transition-colors">
                    <ChevronLeft size={24} />
                </Link>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    The Path of Victory
                </h1>
                <p className="text-gray-500 text-xs mt-1">Ko Nawin Journey</p>
            </motion.header>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex-1"
            >
                <NawinPath />
            </motion.div>
        </div>
    );
}
