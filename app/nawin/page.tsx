"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import NawinPath from "../components/NawinPath";

export default function NawinPage() {
    return (
        <div className="min-h-screen min-w-screen text-gray-800 p-0 max-w-lg mx-auto flex flex-col relative">
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="pt-8 px-6 mb-12 text-center relative z-20"
            >
                <Link href="/" className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-1 text-sm font-black text-gray-500 hover:text-gray-800 bg-white/70 rounded-full px-3 py-1.5 shadow-sm border border-gray-100 transition-all">
                    <ChevronLeft size={16} />
                    Back
                </Link>
                <h1 className="text-2xl font-black text-gray-800">ကိုးနဝင်း</h1>
                <p className="text-gray-400 text-xs mt-1">Ko Nawin Journey</p>
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
