"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import InstallPrompt from "./components/InstallPrompt";

export default function Home() {
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
    // Future books can be added here
  ];

  return (
    <div className="min-h-screen text-white p-6 md:p-8 max-w-4xl mx-auto flex flex-col">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="mt-8 mb-12 text-center"
      >
        <span className="text-xs font-bold tracking-[0.3em] text-orange-200/60 uppercase">
          Sayadaw U Vicittasarabhivamsa
        </span>
        <h1 className="text-4xl md:text-5xl font-bold mt-3 bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 bg-clip-text text-transparent">
          Dhamma Library
        </h1>
        <p className="text-white/40 mt-4 text-sm font-light tracking-wide">
          A Collection of Theravada Chants & Texts
        </p>
      </motion.header>

      <main className="flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book, index) => (
            <Link key={book.id} href={book.href}>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-transparent rounded-2xl flex flex-col items-center"
              >

                {/* Book Cover Container */}
                <div className="relative w-48 aspect-[2/3] md:w-56 shadow-xl rounded-r-lg rounded-l-sm transition-all duration-300 group-hover:shadow-2xl">
                  {/* Spine Effect */}
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent z-10 rounded-l-sm" />

                  {/* Cover Image */}
                  <img
                    src={book.coverImage}
                    alt={book.title}
                    className="w-full h-full object-cover rounded-r-lg rounded-l-sm"
                  />

                  {/* Shine/Lighting */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/5 to-white/10 rounded-r-lg pointer-events-none" />
                </div>

                {/* Metadata below book */}
                <div className="mt-6 text-center">
                  <h2 className="text-xl font-bold text-white mb-1 group-hover:text-amber-100 transition-colors">
                    {book.nativeTitle}
                  </h2>
                  <p className="text-sm text-orange-200/80 font-medium">
                    {book.title}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}

          {/* Spacer / Coming Soon Placeholder */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="opacity-20 flex flex-col items-center justify-center text-center h-full min-h-[160px]"
          >
            <span className="text-white/40 text-sm font-medium"></span>
          </motion.div>
        </div>
      </main>

      <footer className="mt-16 text-center text-white/20 text-xs py-8">
        <p>© {new Date().getFullYear()} Dhamma Project</p>
      </footer>

      <InstallPrompt />
    </div>
  );
}
