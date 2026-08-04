"use client";

import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Book, Leaf, Star, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import InstallPrompt from "./components/InstallPrompt";
import { useAuth } from "./context/AuthContext";
import { db } from "./firebase/config";
import { getNawinDayInfo } from "./utils/nawinLogic";

const NAWIN_90_DAY_SCHEDULE: { no: string; dates: string; item: string; rounds: string }[] = [
    { no: "၁", dates: "(၂၉.၇.၂၀၂၆) မှ (၆.၈.၂၀၂၆) အထိ", item: "အရဟံ", rounds: "၁" },
    { no: "", dates: "", item: "သမ္မာသမ္ဗုဒ္ဓေါ", rounds: "၁" },
    { no: "", dates: "", item: "ဝိဇ္ဇာစရဏသမ္ပန္နော", rounds: "၁" },
    { no: "", dates: "", item: "သုဂတော", rounds: "၁" },
    { no: "", dates: "", item: "လောကဝိဒူ", rounds: "၁" },
    { no: "", dates: "", item: "အနုတ္တရော ပုရိသဒမ္မသာရထိ", rounds: "၁" },
    { no: "", dates: "", item: "သတ္ထာဒေဝမနုဿာနံ", rounds: "၁" },
    { no: "", dates: "", item: "ဗုဒ္ဓေါ", rounds: "၁" },
    { no: "", dates: "", item: "ဘဂဝါ", rounds: "၁" },
    { no: "၂", dates: "(၇.၈.၂၀၂၆) မှ (၁၅.၈.၂၀၂၆) အထိ", item: "အရဟံ သိဒ္ဓိ", rounds: "၉" },
    { no: "၃", dates: "(၁၆.၈.၂၀၂၆) မှ (၂၄.၈.၂၀၂၆) အထိ", item: "သမ္မာသမ္ဗုဒ္ဓေါ သိဒ္ဓိ", rounds: "၉" },
    { no: "၄", dates: "(၂၅.၈.၂၀၂၆) မှ (၂.၉.၂၀၂၆) အထိ", item: "ဝိဇ္ဇာစရဏသမ္ပန္နော သိဒ္ဓိ", rounds: "၉" },
    { no: "၅", dates: "(၃.၉.၂၀၂၆) မှ (၁၁.၉.၂၀၂၆) အထိ", item: "သုဂတော သိဒ္ဓိ", rounds: "၉" },
    { no: "၆", dates: "(၁၂.၉.၂၀၂၆) မှ (၂၀.၉.၂၀၂၆) အထိ", item: "လောကဝိဒူ သိဒ္ဓိ", rounds: "၉" },
    { no: "၇", dates: "(၂၁.၉.၂၀၂၆) မှ (၂၉.၉.၂၀၂၆) အထိ", item: "အနုတ္တရော ပုရိသဒမ္မသာရထိ သိဒ္ဓိ", rounds: "၉" },
    { no: "၈", dates: "(၃၀.၉.၂၀၂၆) မှ (၈.၁၀.၂၀၂၆) အထိ", item: "သတ္ထာဒေဝမနုဿာနံ သိဒ္ဓိ", rounds: "၉" },
    { no: "၉", dates: "(၉.၁၀.၂၀၂၆) မှ (၁၇.၁၀.၂၀၂၆) အထိ", item: "ဗုဒ္ဓေါ သိဒ္ဓိ", rounds: "၉" },
    { no: "၁၀", dates: "(၁၈.၁၀.၂၀၂၆) မှ (၂၆.၁၀.၂၀၂၆) အထိ", item: "ဘဂဝါ သိဒ္ဓိ", rounds: "၉" },
];

export default function Home() {
    const { user } = useAuth();
    const [completedCount, setCompletedCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const localDate = localStorage.getItem("nawin_startDate");
        const localCompleted = localStorage.getItem("nawin_completedCells");
        if (localDate) {
            setHasStarted(true);
            if (localCompleted) setCompletedCount(JSON.parse(localCompleted).length);
        }
    }, []);

    useEffect(() => {
        if (!user) return;
        const fetchCloud = async () => {
            try {
                const snap = await getDoc(doc(db, "users", user.uid));
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.nawinStartDate) {
                        setHasStarted(true);
                        if (data.nawinCompleted) setCompletedCount(data.nawinCompleted.length);
                    }
                }
            } catch {
                // fall back to localStorage
            }
        };
        fetchCloud();
    }, [user]);

    const isAllDone = completedCount >= 81;
    const nextDayNumber = Math.min(81, completedCount + 1);
    const nextDayInfo = isClient && hasStarted && !isAllDone ? getNawinDayInfo(nextDayNumber) : null;
    const isVeggieDay = nextDayInfo ? ((nextDayNumber - 1) % 9) + 1 === 5 : false;

    return (
        <div className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto flex flex-col justify-center">

            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center"
            >
                <h1 className="text-3xl font-black mt-2 text-gray-800">ကိုးနဝင်း</h1>
                <button
                    onClick={() => setShowScheduleModal(true)}
                    className="mt-3 inline-block max-w-full text-[11px] font-bold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors px-3 py-1.5 rounded-full border border-stone-200 truncate"
                >
                    ဝါတွင်း(၃)လ ကိုးနဝင်းပုတီးရက်ပေါင်း (၉၀) အစီစဉ်
                </button>
            </motion.header>

            {/* ── 90-day schedule modal ─────────────────────────────────── */}
            <AnimatePresence>
                {showScheduleModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setShowScheduleModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full sm:max-w-lg max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-100 shrink-0">
                                <h2 className="font-black text-sm text-gray-800">
                                    ဝါတွင်း(၃)လ ကိုးနဝင်းပုတီးရက်ပေါင်း (၉၀) အစီစဉ်
                                </h2>
                                <button
                                    onClick={() => setShowScheduleModal(false)}
                                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 shrink-0"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="overflow-auto p-4">
                                <table className="w-full text-xs border-collapse table-fixed">
                                    <colgroup>
                                        <col className="w-[8%]" />
                                        <col className="w-[22%]" />
                                        <col className="w-[58%]" />
                                        <col className="w-[12%]" />
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-gray-900 text-white">
                                            <th className="p-2 text-left font-bold rounded-l-lg">စဉ်</th>
                                            <th className="p-2 text-left font-bold">ပုတီးစိပ်ရမည့်ရက်</th>
                                            <th className="p-2 text-left font-bold">စိပ်ရမည့်ဂုဏ်တော်</th>
                                            <th className="p-2 text-left font-bold rounded-r-lg">ပတ်</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {NAWIN_90_DAY_SCHEDULE.map((row, i) => (
                                            <tr key={i} className="border-b border-gray-100">
                                                <td className="p-2 align-top text-gray-500">{row.no}</td>
                                                <td className="p-2 align-top text-gray-600 break-words">{row.dates}</td>
                                                <td className="p-2 align-top text-gray-800 font-semibold break-words">{row.item}</td>
                                                <td className="p-2 align-top text-gray-500">({row.rounds})</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Next step card ─────────────────────────────────────────── */}
            {nextDayInfo && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-5"
                >
                    <Link href="/nawin">
                        <div className="bg-gray-900 rounded-2xl p-5 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-3 mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                            Day {nextDayNumber} · Level {nextDayInfo.level}
                                        </span>
                                        {isVeggieDay && (
                                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-green-400">
                                                <Leaf size={9} fill="currentColor" />
                                                Veggie Day
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xl font-black leading-snug">{nextDayInfo.mantra}</p>
                                    <p className="text-sm text-gray-500 mt-1">{nextDayInfo.dayLabel}</p>
                                </div>

                                <div className="shrink-0 text-right">
                                    <p className="text-2xl font-black">{nextDayInfo.rounds}</p>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">rounds</p>
                                </div>
                            </div>

                            <div className="mt-4 w-full h-[2px] bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gray-500 rounded-full transition-all duration-700"
                                    style={{ width: `${(completedCount / 81) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between mt-1.5">
                                <span className="text-[10px] text-gray-600">ကိုးနဝင်း</span>
                                <span className="text-[10px] text-gray-600">{completedCount} / 81</span>
                            </div>
                        </div>
                    </Link>
                </motion.div>
            )}

            {/* All done */}
            {isClient && isAllDone && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 bg-gray-900 rounded-2xl p-5 text-center"
                >
                    <p className="font-black text-lg text-white">ကိုးနဝင်း — ပြီးဆုံးပါပြီ</p>
                    <p className="text-sm text-gray-500 mt-1">All 81 days complete.</p>
                </motion.div>
            )}

            {/* ── Cards ──────────────────────────────────────────────────── */}
            <main className="grid grid-cols-2 gap-4">

                <Link href="/library">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-gray-300 transition-colors"
                    >
                        <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center mb-3 text-stone-500">
                            <Book size={22} />
                        </div>
                        <h2 className="text-base font-black text-gray-800">Library</h2>
                        <p className="text-xs text-gray-400 mt-1">ဓမ္မဂ္ဂန္ထ</p>
                    </motion.div>
                </Link>

                <Link href="/nawin">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center text-center hover:border-gray-300 transition-colors relative"
                    >
                        {isClient && hasStarted && !isAllDone && (
                            <span className="absolute top-3 right-3 text-[10px] font-bold text-gray-400">
                                {completedCount}/81
                            </span>
                        )}
                        <div className="w-11 h-11 rounded-xl bg-stone-100 flex items-center justify-center mb-3 text-stone-500">
                            <Star size={22} />
                        </div>
                        <h2 className="text-base font-black text-gray-800">ကိုးနဝင်း</h2>
                        <p className="text-xs text-gray-400 mt-1">Ko Nawin</p>
                    </motion.div>
                </Link>
            </main>

            <footer className="mt-10 text-center text-gray-300 text-xs">
                © {new Date().getFullYear()} Dhamma Project
            </footer>

            <InstallPrompt />
        </div>
    );
}
