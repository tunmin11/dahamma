"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Leaf, Calendar, Bell, X } from "lucide-react";
import { nawinAttributes } from "../data/nawin";
import ReminderSettings from "./ReminderSettings";
import { db } from "../firebase/config";
import { useAuth } from "../context/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { NawinDayInfo, getNawinDayInfo } from "../utils/nawinLogic";

export default function NawinPath() {
    const { user } = useAuth();
    const [completedCells, setCompletedCells] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [showReminder, setShowReminder] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
    const [selectedDay, setSelectedDay] = useState<NawinDayInfo | null>(null);

    // Persistence & Sync
    useEffect(() => {
        setIsClient(true);
        const savedCompleted = localStorage.getItem("nawin_completedCells");
        const savedDate = localStorage.getItem("nawin_startDate");

        if (savedCompleted) setCompletedCells(JSON.parse(savedCompleted));
        if (savedDate) setStartDate(savedDate);
    }, []);

    // Cloud Sync
    useEffect(() => {
        const syncUser = async () => {
            if (user) {
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        // Merge or overwrite? Let's prioritize Cloud for now, or Merge unique.
                        // Assuming simple overwrite from cloud if it exists is safer for "Sync across devices"
                        if (data.nawinCompleted) {
                            setCompletedCells(data.nawinCompleted);
                            localStorage.setItem("nawin_completedCells", JSON.stringify(data.nawinCompleted));
                        }
                        if (data.nawinStartDate) {
                            setStartDate(data.nawinStartDate);
                            localStorage.setItem("nawin_startDate", data.nawinStartDate);
                        }
                    } else {
                        // If no cloud data, init with local
                        // But wait, if we have local data we should push it? 
                        // Let's do that in the "save" actions to avoid race conditions or overwriting empty cloud on fresh login?
                        // Actually, if it's a new user doc, we can push local state.
                        if (completedCells.length > 0 || startDate) {
                            await setDoc(docRef, {
                                nawinCompleted: completedCells,
                                nawinStartDate: startDate,
                                updatedAt: new Date()
                            }, { merge: true });
                        }
                    }
                } catch (e) {
                    console.error("Error syncing with cloud:", e);
                }
            }
        };

        syncUser();
    }, [user]);

    // Auto-scroll to current stage
    useEffect(() => {
        if (isClient && !hasInitialScrolled) {
            // Calculate current stage (1-based)
            // If all complete (81), stick to 9.
            // If 0 complete, 1.
            const totalCompleted = completedCells.length;
            const currentStage = Math.min(9, Math.floor(totalCompleted / 9) + 1);

            // Give a small delay for render
            const timer = setTimeout(() => {
                const element = document.getElementById(`stage-${currentStage}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                setHasInitialScrolled(true);
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isClient, completedCells, hasInitialScrolled]);

    const handleStartSetup = (dateString: string) => {
        if (!dateString) return;

        // Create a date object from the input value (YYYY-MM-DD)
        // We append "T00:00:00" to ensure local time parsing or at least consistent parsing
        // actually, let's just parse the components to be safe from timezone shifts
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        if (date.getDay() !== 1) {
            alert("Please select a Monday to start the ritual.");
            return;
        }
        setStartDate(dateString);
        localStorage.setItem("nawin_startDate", dateString);

        if (user) {
            setDoc(doc(db, "users", user.uid), {
                nawinStartDate: dateString,
                updatedAt: new Date()
            }, { merge: true });
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
                setDoc(doc(db, "users", user.uid), {
                    nawinStartDate: null,
                    nawinCompleted: [],
                    updatedAt: new Date()
                }, { merge: true });
            }
        }
    };

    const getCellId = (row: number, col: number) => `${row}-${col}`;

    const isCellUnlocked = (row: number, col: number) => {
        if (row === 1 && col === 1) return true;
        if (col > 1) return completedCells.includes(getCellId(row, col - 1));
        if (col === 1 && row > 1) return completedCells.includes(getCellId(row - 1, 9));
        return false;
    };


    const handleCellClick = (row: number, col: number) => {
        if (!isCellUnlocked(row, col)) return;

        // Calculate absolute day (1-81)
        const dayOfRitual = ((row - 1) * 9) + col;
        const info = getNawinDayInfo(dayOfRitual);

        setSelectedDay(info);
    };

    const handleDayComplete = () => {
        if (!selectedDay) return;

        const row = selectedDay.stage; // This is actually stage ID
        // Note: Logic needs (row, col).
        // We can reverse calc col or pass it.
        // Row is stage. Col is (day-1)%9 + 1.
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
                }, { merge: true });
            }
        } else {
            // Handle toggle off logic if needed? 
            // The original code only handles "If not included, add". 
            // But the UI shows "Mark as Incomplete". 
            // Let's check logic: The UI button says "Mark as Incomplete" but logic only adds?
            // Ah, look at lines 230+: it calls handleDayComplete regardless.
            // But original logic 104: if (!includes) add. It does NOT remove!
            // I should probably fix that too if user wants to untoggle.
            // Ref: "Mark as Incomplete" implies toggling off.
            const newCompleted = completedCells.filter(id => id !== cellId);
            setCompletedCells(newCompleted);
            localStorage.setItem("nawin_completedCells", JSON.stringify(newCompleted));

            if (user) {
                setDoc(doc(db, "users", user.uid), {
                    nawinCompleted: newCompleted,
                    updatedAt: new Date()
                }, { merge: true });
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

    // Helper to generate the path coordinates for a unit
    const getNodePosition = (index: number) => {
        // 0-8 items
        const ySpacing = 80;
        const xBase = 50; // Center %
        const xAmp = 35; // Amplitude %

        // Sine wave pattern
        const x = xBase + Math.sin(index * 0.8) * xAmp;

        // Reverse Y: Day 1 (index 0) at Bottom, Day 9 (index 8) at Top
        // Container roughly 750px.
        // Let's start from y=680 for index 0 div center
        const startY = 680;
        const y = startY - (index * ySpacing);

        return { x, y };
    };

    // Helper for Circular Progress
    const totalSteps = 81;
    const completedCount = completedCells.length;
    const progressPercentage = (completedCount / totalSteps) * 100;
    // SVG Circle Logic
    const circleRadius = 18;
    const circleCircumference = 2 * Math.PI * circleRadius;
    // This is purely for rendering, offset calculation is done in JSX

    // Construct Attribute for Selected Day View
    const getSelectedAttribute = () => {
        if (!selectedDay) return null;
        const stageColor = nawinAttributes.find(a => a.id === selectedDay.stage)?.color || "from-gray-500 to-gray-600";

        return {
            id: selectedDay.day, // Use absolute day as ID context
            pali: selectedDay.attribute,
            meaning: selectedDay.burmese, // Show Burmese
            description: `Stage ${selectedDay.stage} • ${selectedDay.planet.toUpperCase()} • ${selectedDay.beads} Rounds`,
            requiredCounts: selectedDay.beads * 108,
            color: stageColor
        };
    };

    if (isClient && !startDate) {
        return (
            <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-lg mt-10">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6 text-blue-600">
                    <Calendar size={32} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Begin Your Journey</h2>
                <p className="text-gray-500 text-sm mb-8">
                    The Ko Nawin ritual starts on a <strong>Monday</strong>. Pick your date.
                </p>
                <input
                    type="date"
                    className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-800 mb-6 w-full text-center focus:outline-none focus:border-blue-500 transition-colors"
                    onChange={(e) => handleStartSetup(e.target.value)}
                />
            </div>
        );
    }

    return (
        <div className="w-full pb-20 relative">
            {/* Simple Day Info Modal */}
            {selectedDay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDay(null)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className={`p-6 bg-gradient-to-r ${getSelectedAttribute()?.color} text-white text-center relative`}>
                            <button
                                onClick={() => setSelectedDay(null)}
                                className="absolute top-4 right-4 p-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1 block">
                                Day {selectedDay.day} • Stage {selectedDay.stage}
                            </span>
                            <h3 className="text-2xl font-bold mb-1">{selectedDay.attribute}</h3>
                            <p className="text-lg opacity-90 font-medium">{selectedDay.burmese}</p>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <div className="flex items-center justify-center gap-3 mb-8">
                                <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100 flex-1">
                                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Planet</div>
                                    <div className="font-bold text-gray-800 capitalize">{selectedDay.planet}</div>
                                </div>
                                <div className="text-center p-4 bg-orange-50 rounded-xl border border-orange-100 flex-1">
                                    <div className="text-orange-400 text-[10px] font-bold uppercase tracking-wider mb-1">Beads</div>
                                    <div className="font-bold text-gray-800">{selectedDay.beads} Rounds</div>
                                </div>
                            </div>

                            <button
                                onClick={handleDayComplete}
                                className={`
                                    w-full py-3.5 rounded-xl font-bold font-medium transition-all flex items-center justify-center gap-2
                                    ${completedCells.includes(getCellId(selectedDay.stage, ((selectedDay.day - 1) % 9) + 1))
                                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                                        : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg hover:shadow-xl"
                                    }
                                `}
                            >
                                {completedCells.includes(getCellId(selectedDay.stage, ((selectedDay.day - 1) % 9) + 1)) ? (
                                    <>Mark as Incomplete</>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        Mark as Complete
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Top Controls & Progress */}
            <div className="sticky top-0 z-40 bg-[#F0EEE9]/95 backdrop-blur-md py-4 px-6 border-b border-black/5 flex justify-between items-center mb-6 shadow-sm supports-[backdrop-filter]:bg-[#F0EEE9]/80">
                <button onClick={() => setShowReminder(true)} className="p-2 bg-white/50 rounded-full text-gray-600 hover:bg-white hover:text-black transition-colors shadow-sm ring-1 ring-black/5 relative z-10">
                    <Bell size={20} />
                </button>

                {/* Circular Progress Indicator */}
                <div className="flex flex-col items-center">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="18" stroke="#E5E0D8" strokeWidth="4" fill="none" />
                            <circle
                                cx="24" cy="24" r="18"
                                stroke="#D97706" // Amber-600
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={circleCircumference}
                                strokeDashoffset={circleCircumference - (progressPercentage / 100) * circleCircumference}
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute text-[10px] font-bold text-gray-700">
                            {Math.round(progressPercentage)}%
                        </div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">{completedCount} of 81</span>
                </div>

                <button onClick={resetProgress} className="text-gray-400 text-xs hover:text-red-500 font-medium">
                    Reset
                </button>
            </div>

            {showReminder && <ReminderSettings onClose={() => setShowReminder(false)} startDate={startDate} />}

            <div className="space-y-12 flex flex-col-reverse">
                {nawinAttributes.map((attr, attrIndex) => (
                    <div key={attr.id} id={`stage-${attr.id}`} className="relative">
                        {/* Chapter Header */}
                        <div className={`
                    sticky top-24 z-20 mx-auto w-max max-w-[85%] px-6 py-2 rounded-full shadow-md mb-8 border border-white/40
                    bg-gradient-to-r ${attr.color} text-white
                `}>
                            <div className="text-center">
                                <span className="text-[9px] uppercase font-bold tracking-widest opacity-80 block">
                                    Stage {attr.id}
                                </span>
                                <h3 className="font-bold text-sm md:text-base whitespace-nowrap shadow-sm">
                                    {attr.pali}
                                </h3>
                            </div>
                        </div>

                        {/* The Path Container */}
                        <div className="relative mx-auto max-w-md h-[750px]">
                            {/* SVG Line Background */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                                <path
                                    d={`
                                M ${getNodePosition(0).x}% ${getNodePosition(0).y} 
                                ${[...Array(8)].map((_, i) => {
                                        const next = getNodePosition(i + 1);
                                        return `L ${next.x}% ${next.y}`;
                                    }).join(' ')}
                            `}
                                    stroke="#D6D3CD"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeDasharray="12 8"
                                />
                            </svg>

                            {/* Nodes */}
                            {[...Array(9)].map((_, i) => {
                                const col = i + 1;
                                const pos = getNodePosition(i);
                                const cellId = getCellId(attr.id, col);
                                const isDone = isClient && completedCells.includes(cellId);
                                const isUnlocked = isClient && isCellUnlocked(attr.id, col);
                                const isVeggie = col === 5;
                                const date = getCellDate(attr.id, col);

                                return (
                                    <div
                                        key={cellId}
                                        className="absolute transform -translate-x-1/2 -translate-y-1/2 w-20 flex flex-col items-center justify-center cursor-pointer group"
                                        style={{ left: `${pos.x}%`, top: pos.y }}
                                        onClick={() => handleCellClick(attr.id, col)}
                                    >
                                        <motion.div
                                            whileTap={isUnlocked ? { scale: 0.9 } : {}}
                                            animate={isUnlocked && !isDone ? {
                                                y: [0, -4, 0],
                                                boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                                            } : {}}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className={`
                                        w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg border-2 transition-all relative z-10
                                        ${isDone
                                                    ? `bg-gradient-to-br ${attr.color} border-white text-white`
                                                    : isUnlocked
                                                        ? "bg-white border-blue-200 text-gray-800"
                                                        : "bg-[#E5E0D8] border-transparent text-gray-400"
                                                }
                                    `}
                                        >
                                            {isDone ? (
                                                <Check size={24} strokeWidth={4} />
                                            ) : isUnlocked ? (
                                                <div className="text-center leading-none">
                                                    <div className="text-[8px] font-bold text-gray-400 mb-0.5">DAY</div>
                                                    <div className="text-lg font-bold">{col}</div>
                                                </div>
                                            ) : (
                                                <Lock size={16} />
                                            )}

                                            {/* Veggie Badge */}
                                            {isVeggie && (
                                                <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1 shadow-sm border border-white z-20">
                                                    <Leaf size={10} fill="white" className="text-white" />
                                                </div>
                                            )}
                                        </motion.div>

                                        {/* Date Label Under Node */}
                                        <div className={`
                                    mt-2 text-center px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap
                                    ${isUnlocked ? "bg-white/80 text-gray-600 border border-gray-200" : "text-gray-400"}
                                `}>
                                            {date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' }) : `Day ${col}`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
