/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Bell, Check, Flame, LayoutGrid, Leaf, Lock, Route, Shield, Star, Trophy, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { nawinAttributes } from "../data/nawin";
import { db } from "../firebase/config";
import { NawinDayInfo, getNawinDayInfo } from "../utils/nawinLogic";
import NawinJourneyComplete from "./NawinJourneyComplete";
import ReminderSettings from "./ReminderSettings";

export default function NawinPath() {
    const { user } = useAuth();
    const [completedCells, setCompletedCells] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [journeyLog, setJourneyLog] = useState<{ completedAt: string }[]>([]);
    const [showReminder, setShowReminder] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
    const [selectedDay, setSelectedDay] = useState<NawinDayInfo | null>(null);
    const [viewMode, setViewMode] = useState<'path' | 'grid'>('path');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

    useEffect(() => {
        setIsClient(true);
        const savedCompleted = localStorage.getItem("nawin_completedCells");
        const savedDate = localStorage.getItem("nawin_startDate");
        const savedJourneyLog = localStorage.getItem("nawin_journeyLog");
        if (savedCompleted) setCompletedCells(JSON.parse(savedCompleted));
        if (savedDate) setStartDate(savedDate);
        if (savedJourneyLog) setJourneyLog(JSON.parse(savedJourneyLog));
    }, []);

    useEffect(() => {
        const syncUser = async () => {
            if (user) {
                setSyncStatus('syncing');
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.nawinCompleted) {
                            setCompletedCells(data.nawinCompleted);
                            localStorage.setItem("nawin_completedCells", JSON.stringify(data.nawinCompleted));
                        }
                        if (data.nawinStartDate) {
                            setStartDate(data.nawinStartDate);
                            localStorage.setItem("nawin_startDate", data.nawinStartDate);
                        }
                        if (data.nawinJourneyLog) {
                            setJourneyLog(data.nawinJourneyLog);
                            localStorage.setItem("nawin_journeyLog", JSON.stringify(data.nawinJourneyLog));
                        }
                    } else {
                        const localCompleted = completedCells.length > 0
                            ? completedCells
                            : JSON.parse(localStorage.getItem("nawin_completedCells") || "[]");
                        const localDate = startDate || localStorage.getItem("nawin_startDate");
                        const localJourneyLog = journeyLog.length > 0
                            ? journeyLog
                            : JSON.parse(localStorage.getItem("nawin_journeyLog") || "[]");
                        if (localCompleted.length > 0 || localDate || localJourneyLog.length > 0) {
                            await setDoc(docRef, {
                                nawinCompleted: localCompleted,
                                nawinStartDate: localDate,
                                nawinJourneyLog: localJourneyLog,
                                updatedAt: new Date()
                            }, { merge: true });
                        }
                    }
                    setSyncStatus('success');
                    setTimeout(() => setSyncStatus('idle'), 3000);
                } catch (e: any) {
                    setSyncStatus('error');
                    if (e.code === 'permission-denied') {
                        alert("Sync Error: Permission Denied. Check Firebase Rules.");
                    } else {
                        alert(`Sync Error: ${e.message}`);
                    }
                }
            }
        };
        syncUser();
    }, [user]);

    useEffect(() => {
        if (isClient && !hasInitialScrolled) {
            const totalCompleted = completedCells.length;
            const currentStage = Math.min(9, Math.floor(totalCompleted / 9) + 1);
            const timer = setTimeout(() => {
                const element = document.getElementById(`stage-${currentStage}`);
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setHasInitialScrolled(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isClient, completedCells, hasInitialScrolled]);

    const handleStartSetup = (dateString: string) => {
        if (!dateString) return;
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        if (date.getDay() !== 1) {
            alert("Please select a Monday to start the ritual.");
            return;
        }
        setStartDate(dateString);
        localStorage.setItem("nawin_startDate", dateString);
        if (user) {
            setSyncStatus('syncing');
            setDoc(doc(db, "users", user.uid), {
                nawinStartDate: dateString,
                updatedAt: new Date()
            }, { merge: true })
                .then(() => {
                    setSyncStatus('success');
                    setTimeout(() => setSyncStatus('idle'), 3000);
                })
                .catch((e: any) => {
                    setSyncStatus('error');
                    alert(`Save Failed: ${e.message}`);
                });
        }
    };

    const resetProgress = () => {
        if (confirm("Are you sure you want to reset your ritual? This cannot be undone.")) {
            setStartDate(null);
            setCompletedCells([]);
            localStorage.removeItem("nawin_startDate");
            localStorage.removeItem("nawin_completedCells");
            setHasInitialScrolled(false);
            if (user) {
                setSyncStatus('syncing');
                setDoc(doc(db, "users", user.uid), {
                    nawinStartDate: null,
                    nawinCompleted: [],
                    updatedAt: new Date()
                }, { merge: true })
                    .then(() => {
                        setSyncStatus('success');
                        setTimeout(() => setSyncStatus('idle'), 3000);
                    })
                    .catch(e => {
                        console.error(e);
                        setSyncStatus('error');
                    });
            }
        }
    };

    const handleStartNewJourney = () => {
        const newLog = [...journeyLog, { completedAt: new Date().toISOString() }];
        setJourneyLog(newLog);
        setStartDate(null);
        setCompletedCells([]);
        localStorage.setItem("nawin_journeyLog", JSON.stringify(newLog));
        localStorage.removeItem("nawin_startDate");
        localStorage.removeItem("nawin_completedCells");
        setHasInitialScrolled(false);
        if (user) {
            setSyncStatus('syncing');
            setDoc(doc(db, "users", user.uid), {
                nawinJourneyLog: newLog,
                nawinStartDate: null,
                nawinCompleted: [],
                updatedAt: new Date()
            }, { merge: true })
                .then(() => {
                    setSyncStatus('success');
                    setTimeout(() => setSyncStatus('idle'), 3000);
                })
                .catch((e: any) => {
                    setSyncStatus('error');
                    alert(`Save Failed: ${e.message}`);
                });
        }
    };

    const getCellId = (row: number, col: number) => `${row}-${col}`;

    const isCellUnlocked = (row: number, col: number) => {
        if (row === 1 && col === 1) return true;

        const sequentiallyUnlocked = col > 1
            ? completedCells.includes(getCellId(row, col - 1))
            : row > 1 && completedCells.includes(getCellId(row - 1, 9));
        if (sequentiallyUnlocked) return true;

        const cellDate = getCellDate(row, col);
        if (!cellDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        cellDate.setHours(0, 0, 0, 0);
        return cellDate <= today;
    };

    const handleCellClick = (row: number, col: number) => {
        if (!isCellUnlocked(row, col)) return;
        const dayOfRitual = ((row - 1) * 9) + col;
        const info = getNawinDayInfo(dayOfRitual);
        setSelectedDay(info);
    };

    const handleDayComplete = () => {
        if (!selectedDay) return;
        const row = selectedDay.level;
        const col = ((selectedDay.day - 1) % 9) + 1;
        const cellId = getCellId(row, col);
        if (!completedCells.includes(cellId)) {
            const newCompleted = [...completedCells, cellId];
            setCompletedCells(newCompleted);
            localStorage.setItem("nawin_completedCells", JSON.stringify(newCompleted));
            if (user) {
                setDoc(doc(db, "users", user.uid), {
                    nawinCompleted: newCompleted,
                    updatedAt: new Date()
                }, { merge: true }).catch((e) => console.error("❌ Failed to save:", e));
            }
        } else {
            const newCompleted = completedCells.filter(id => id !== cellId);
            setCompletedCells(newCompleted);
            localStorage.setItem("nawin_completedCells", JSON.stringify(newCompleted));
            if (user) {
                setDoc(doc(db, "users", user.uid), {
                    nawinCompleted: newCompleted,
                    updatedAt: new Date()
                }, { merge: true }).catch((e) => console.error("❌ Failed to sync:", e));
            }
        }
        setSelectedDay(null);
    };

    const getCellDate = (row: number, col: number) => {
        if (!startDate) return null;
        const [year, month, day] = startDate.split('-').map(Number);
        const localStart = new Date(year, month - 1, day);
        const offset = ((row - 1) * 9) + (col - 1);
        const cellDate = new Date(localStart);
        cellDate.setDate(localStart.getDate() + offset);
        return cellDate;
    };

    const getNodePosition = (index: number) => {
        const ySpacing = 80;
        const xBase = 50;
        const xAmp = 35;
        const x = xBase + Math.sin(index * 0.8) * xAmp;
        const startY = 680;
        const y = startY - (index * ySpacing);
        return { x, y };
    };

    const totalSteps = 81;
    const completedCount = completedCells.length;
    const progressPercentage = (completedCount / totalSteps) * 100;

    const getSelectedAttribute = () => {
        if (!selectedDay) return null;
        const stageColor = nawinAttributes.find(a => a.id === selectedDay.level)?.color || "from-gray-500 to-gray-600";
        return {
            id: selectedDay.day,
            pali: selectedDay.mantra,
            meaning: selectedDay.dayLabel,
            description: `Level ${selectedDay.level} • ${selectedDay.dayLabel} • ${selectedDay.rounds} Rounds`,
            requiredCounts: selectedDay.rounds * 108,
            color: stageColor
        };
    };

    // First unlocked-and-not-done cell — the Duolingo "current" node
    const currentActiveCellId = isClient ? (() => {
        for (let row = 1; row <= 9; row++) {
            for (let col = 1; col <= 9; col++) {
                const cellId = getCellId(row, col);
                if (isCellUnlocked(row, col) && !completedCells.includes(cellId)) return cellId;
            }
        }
        return null;
    })() : null;

    // ── Start screen ────────────────────────────────────────────────────────
    if (isClient && !startDate) {
        return (
            <div className="w-full max-w-md mx-auto px-4 mt-10">
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-900 px-8 pt-10 pb-8 text-center">
                        <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-5 border-b-4 border-white/60">
                            <Trophy size={44} className="text-gray-800" />
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight">BEGIN YOUR QUEST</h2>
                        <p className="text-gray-400 text-sm mt-1 font-semibold">81 days · 9 levels · 1 ritual</p>
                    </div>
                    <div className="p-6">
                        <p className="text-gray-500 text-sm text-center mb-5">
                            The Ko Nawin ritual starts on a{" "}
                            <strong className="text-gray-800">Monday</strong>. Pick your start date.
                        </p>
                        <input
                            type="date"
                            className="bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3.5 text-gray-800 mb-5 w-full text-center focus:outline-none focus:border-gray-400 transition-colors font-bold"
                            onChange={(e) => handleStartSetup(e.target.value)}
                        />
                        <div className="flex items-center justify-center gap-5 text-[11px] font-black text-gray-400 uppercase tracking-wide">
                            <div className="flex items-center gap-1">
                                <Zap size={11} className="text-gray-500" />XP Rewards
                            </div>
                            <div className="flex items-center gap-1">
                                <Flame size={11} className="text-gray-500" />Streaks
                            </div>
                            <div className="flex items-center gap-1">
                                <Star size={11} className="text-gray-500" />Stage Stars
                            </div>
                        </div>
                        {journeyLog.length > 0 && (
                            <p className="text-center text-xs font-bold text-gray-400 mt-4">
                                You&apos;ve completed {journeyLog.length} journey{journeyLog.length > 1 ? "s" : ""} before
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── Journey complete screen ─────────────────────────────────────────────
    if (isClient && startDate && completedCells.length === 81) {
        return (
            <NawinJourneyComplete
                journeyCount={journeyLog.length + 1}
                onStartNew={handleStartNewJourney}
            />
        );
    }

    // ── Main view ────────────────────────────────────────────────────────────
    return (
        <div className="w-full pb-20 relative">

            {/* ── Day detail modal ─────────────────────────────────────────── */}
            {selectedDay && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedDay(null)}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 60 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Gradient header */}
                        <div className={`p-6 bg-gradient-to-br ${getSelectedAttribute()?.color} text-white text-center relative`}>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="absolute top-4 right-4 p-2 bg-black/15 rounded-full hover:bg-black/25 transition-colors"
                            >
                                <X size={14} />
                            </button>
                            <div className="w-14 h-14 mx-auto bg-white/20 rounded-2xl flex items-center justify-center mb-3">
                                <Zap size={28} className="text-white" fill="currentColor" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block mb-1">
                                Day {selectedDay.day} · Level {selectedDay.level}
                            </span>
                            <h3 className="text-2xl font-black mb-0.5">{selectedDay.mantra}</h3>
                            <p className="text-sm opacity-80 font-bold">{selectedDay.levelName}</p>
                        </div>

                        {/* Body */}
                        <div className="p-5">
                            <div className="flex gap-3 mb-5">
                                <div className="flex-1 bg-gray-50 rounded-2xl p-3.5 text-center border-2 border-gray-100">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">Day</div>
                                    <div className="font-black text-gray-800 capitalize">{selectedDay.dayLabel}</div>
                                </div>
                                <div className="flex-1 bg-stone-50 rounded-2xl p-3.5 text-center border-2 border-stone-200">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-stone-500 mb-1 flex items-center justify-center gap-0.5">
                                        <Zap size={9} className="text-stone-400" />Rounds
                                    </div>
                                    <div className="font-black text-stone-700">{selectedDay.rounds} Rounds</div>
                                </div>
                            </div>

                            {completedCells.includes(getCellId(selectedDay.level, ((selectedDay.day - 1) % 9) + 1)) ? (
                                <button
                                    onClick={handleDayComplete}
                                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors border-2 border-transparent hover:border-red-100"
                                >
                                    Mark as Incomplete
                                </button>
                            ) : (
                                <button
                                    onClick={handleDayComplete}
                                    className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white bg-gray-900 border-b-4 border-gray-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Check size={18} strokeWidth={3} />
                                    Complete!
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}

            {/* ── Top bar ──────────────────────────────────────────────────── */}
            <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md py-3 px-4 border-b border-gray-100 flex items-center gap-3 mb-4 shadow-sm">
                <button
                    onClick={() => setShowReminder(true)}
                    className="p-2.5 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
                >
                    <Bell size={18} />
                </button>

                <button
                    onClick={() => setViewMode(prev => prev === 'path' ? 'grid' : 'path')}
                    className="p-2.5 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
                >
                    {viewMode === 'path' ? <LayoutGrid size={18} /> : <Route size={18} />}
                </button>

                {/* XP bar */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1">
                            <Zap size={11} className="text-gray-500" fill="currentColor" />
                            <span className="text-[11px] font-black text-gray-600 uppercase tracking-wide">XP</span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400">{completedCount} / 81</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                        <div
                            className="h-full bg-gray-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>

                {/* Flame streak */}
                <div className="flex items-center gap-1 bg-stone-100 border-2 border-stone-200 rounded-xl px-2.5 py-1.5">
                    <Flame size={14} className="text-stone-500" fill="currentColor" />
                    <span className="text-[12px] font-black text-stone-600">{Math.round(progressPercentage)}%</span>
                </div>

                <button
                    onClick={resetProgress}
                    className="text-gray-300 text-[11px] hover:text-red-400 font-black uppercase tracking-wide transition-colors"
                >
                    Reset
                </button>
            </div>

            {showReminder && <ReminderSettings onClose={() => setShowReminder(false)} startDate={startDate} />}

            {/* ── Path view ────────────────────────────────────────────────── */}
            <div className={`space-y-4 flex flex-col-reverse relative ${viewMode === 'grid' ? 'hidden' : 'block'}`}>
                {nawinAttributes.map((attr) => {
                    const stageCompleted = [...Array(9)].filter((_, i) =>
                        completedCells.includes(getCellId(attr.id, i + 1))
                    ).length;
                    const stageStars = stageCompleted === 9 ? 3 : stageCompleted >= 6 ? 2 : stageCompleted >= 3 ? 1 : 0;
                    const TierIcon = attr.id <= 3 ? Shield : attr.id <= 6 ? Star : Trophy;

                    return (
                        <div key={attr.id} id={`stage-${attr.id}`} className="relative">

                            {/* ── Duolingo section banner ───────────────────── */}
                            <div className="sticky top-18 z-20 mx-4 mb-8">
                                <div className={`bg-gradient-to-r ${attr.color} rounded-2xl px-5 py-4 text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] border border-white/20`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                                                <TierIcon size={18} className="text-white" />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] opacity-80 block">
                                                    Level {attr.id}
                                                </span>
                                                <h3 className="font-black text-base leading-tight">{attr.pali}</h3>
                                            </div>
                                        </div>
                                        {/* Stage star rating */}
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3].map(s => (
                                                <Star
                                                    key={s}
                                                    size={18}
                                                    className={s <= stageStars ? 'text-white' : 'text-white/25'}
                                                    fill={s <= stageStars ? 'currentColor' : 'none'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {/* Mini progress bar */}
                                    <div className="mt-3 w-full h-1.5 bg-black/15 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-white/50 rounded-full transition-all duration-700"
                                            style={{ width: `${(stageCompleted / 9) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Path container ───────────────────────────── */}
                            <div className="relative mx-auto max-w-md h-[750px]">

                                {/* Thick dotted path line */}
                                <svg
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                    style={{ overflow: 'visible' }}
                                    viewBox="0 0 100 750"
                                    preserveAspectRatio="none"
                                >
                                    <path
                                        d={`M ${getNodePosition(0).x} ${getNodePosition(0).y} ${[...Array(8)].map((_, i) => {
                                            const next = getNodePosition(i + 1);
                                            return `L ${next.x} ${next.y}`;
                                        }).join(' ')}`}
                                        stroke="#D1D5DB"
                                        strokeWidth="4"
                                        vectorEffect="non-scaling-stroke"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeDasharray="10 8"
                                    />
                                </svg>

                                {/* ── Nodes ────────────────────────────────── */}
                                {[...Array(9)].map((_, i) => {
                                    const col = i + 1;
                                    const pos = getNodePosition(i);
                                    const cellId = getCellId(attr.id, col);
                                    const isDone = isClient && completedCells.includes(cellId);
                                    const isUnlocked = isClient && isCellUnlocked(attr.id, col);
                                    const isCurrentActive = cellId === currentActiveCellId;
                                    const isVeggie = col === 5;
                                    const date = getCellDate(attr.id, col);

                                    return (
                                        <div
                                            key={cellId}
                                            className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                            style={{ left: `${pos.x}%`, top: `${pos.y / 7.5}%` }}
                                            onClick={() => handleCellClick(attr.id, col)}
                                        >
                                            <motion.div
                                                animate={isCurrentActive ? { y: [0, -6, 0] } : {}}
                                                transition={isCurrentActive
                                                    ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                                                    : { duration: 0.2 }
                                                }
                                                className="flex flex-col items-center cursor-pointer"
                                            >
                                                {/* Floating START badge */}
                                                {isCurrentActive && (
                                                    <div className="mb-2 bg-white text-gray-800 text-[10px] font-black px-3 py-1 rounded-full shadow-lg border-b-2 border-gray-200 uppercase tracking-wide whitespace-nowrap">
                                                        START
                                                    </div>
                                                )}

                                                {/* Node circle */}
                                                <motion.div
                                                    whileTap={isUnlocked ? { scale: 0.88, y: 3 } : {}}
                                                    className={`
                                                        w-16 h-16 rounded-full flex items-center justify-center relative border-b-4 transition-colors
                                                        ${isDone
                                                            ? 'bg-gray-800 border-gray-900 text-white shadow-md'
                                                            : isUnlocked
                                                            ? `bg-gradient-to-b ${attr.color} border-black/20 text-white shadow-lg`
                                                            : 'bg-gray-200 border-gray-300 text-gray-400 shadow-sm'
                                                        }
                                                        ${isCurrentActive ? 'ring-4 ring-white ring-offset-2 ring-offset-transparent shadow-xl' : ''}
                                                    `}
                                                >
                                                    {isDone ? (
                                                        <Star size={26} fill="currentColor" strokeWidth={0.5} />
                                                    ) : isUnlocked ? (
                                                        <div className="text-center leading-none">
                                                            <div className="text-[8px] font-black text-white/70 uppercase tracking-wider mb-0.5">DAY</div>
                                                            <div className="text-xl font-black">{col}</div>
                                                        </div>
                                                    ) : (
                                                        <Lock size={18} strokeWidth={2.5} />
                                                    )}

                                                    {/* Veggie badge */}
                                                    {isVeggie && (
                                                        <div className="absolute -top-1.5 -right-1.5 bg-stone-500 rounded-full p-1.5 shadow border-2 border-white z-20">
                                                            <Leaf size={8} fill="white" className="text-white" />
                                                        </div>
                                                    )}
                                                </motion.div>

                                                {/* Date label */}
                                                <div className={`
                                                    mt-2 text-[10px] font-bold whitespace-nowrap px-2 py-0.5 rounded-lg
                                                    ${isDone
                                                        ? 'text-gray-700 bg-gray-100'
                                                        : isUnlocked
                                                        ? 'text-gray-600 bg-white shadow-sm border border-gray-100'
                                                        : 'text-gray-400'
                                                    }
                                                `}>
                                                    {date
                                                        ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
                                                        : `Day ${col}`
                                                    }
                                                </div>
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Grid view ────────────────────────────────────────────────── */}
            {viewMode === 'grid' && (
                <div className="min-w-full flex justify-center overflow-x-auto pb-20 px-4">
                    <div className="lg:min-w-2/3 w-full bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Header row */}
                        <div className="grid grid-cols-[100px_repeat(9,1fr)] bg-gray-50 border-b-2 border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-wider text-center py-3 sticky top-0 z-10">
                            <div className="px-3 text-left">Level</div>
                            {[...Array(9)].map((_, i) => <div key={i}>{i + 1}</div>)}
                        </div>

                        <div className="divide-y divide-gray-100">
                            {nawinAttributes.map((attr) => (
                                <div key={attr.id} className="grid grid-cols-[100px_repeat(9,1fr)] items-center hover:bg-gray-50/50 transition-colors">
                                    {/* Level label */}
                                    <div className="p-2.5 text-left border-r-2 border-gray-100">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${attr.color} flex items-center justify-center text-white text-xs font-black shadow-sm border-b-2 border-black/10`}>
                                                {attr.id}
                                            </div>
                                            <span className="font-black text-gray-700 text-[10px] text-center leading-tight">{attr.pali}</span>
                                        </div>
                                    </div>

                                    {/* Day cells */}
                                    {[...Array(9)].map((_, i) => {
                                        const col = i + 1;
                                        const cellId = getCellId(attr.id, col);
                                        const isDone = isClient && completedCells.includes(cellId);
                                        const isUnlocked = isClient && isCellUnlocked(attr.id, col);
                                        const isVeggie = col === 5;
                                        const globalDay = ((attr.id - 1) * 9) + col;
                                        const dayInfo = getNawinDayInfo(globalDay);

                                        return (
                                            <div key={col} className="p-1 h-full flex justify-center items-center">
                                                <motion.button
                                                    whileTap={isUnlocked ? { scale: 0.9, y: 2 } : {}}
                                                    onClick={() => handleCellClick(attr.id, col)}
                                                    className={`
                                                        relative w-full h-20 rounded-xl flex flex-col items-center justify-center border-b-4 transition-all
                                                        ${isDone
                                                            ? 'bg-gray-800 border-gray-900 text-white shadow-sm'
                                                            : isUnlocked
                                                            ? `bg-gradient-to-br ${attr.color} border-black/15 text-white shadow-md hover:shadow-lg`
                                                            : 'bg-gray-100 border-gray-200 text-gray-400'
                                                        }
                                                        ${isVeggie && !isDone ? 'ring-2 ring-stone-400 ring-offset-1' : ''}
                                                    `}
                                                >
                                                    {isDone ? (
                                                        <Star size={20} fill="currentColor" strokeWidth={0.5} />
                                                    ) : isUnlocked ? (
                                                        <>
                                                            <span className="text-xs font-black text-center px-1 leading-normal drop-shadow-sm">{dayInfo.mantra}</span>
                                                            <span className="text-[11px] opacity-90 font-bold mt-0.5">( {dayInfo.rounds} ) ပတ်</span>
                                                        </>
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <Lock size={13} className="text-gray-300" />
                                                            <span className="text-[10px] font-bold text-gray-300">{dayInfo.mantra}</span>
                                                        </div>
                                                    )}
                                                </motion.button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
