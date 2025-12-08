"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Lock, Leaf, Calendar } from "lucide-react";
import { nawinAttributes } from "../data/nawin";

export default function NawinTable() {
    const [completedCells, setCompletedCells] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
    const [isClient, setIsClient] = useState(false);

    // Persistence
    useEffect(() => {
        setIsClient(true);
        const savedCompleted = localStorage.getItem("nawin_completedCells");
        const savedDate = localStorage.getItem("nawin_startDate");

        if (savedCompleted) setCompletedCells(JSON.parse(savedCompleted));
        if (savedDate) setStartDate(savedDate);
    }, []);

    const handleStartSetup = (dateString: string) => {
        const date = new Date(dateString);
        // Adjust for timezone to ensure day calculation is correct for the selected date
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset);

        if (localDate.getDay() !== 1) { // 0 is Sunday, 1 is Monday
            alert("Please select a Monday to start the ritual.");
            return;
        }
        setStartDate(dateString);
        localStorage.setItem("nawin_startDate", dateString);
    };

    const resetProgress = () => {
        if (confirm("Are you sure you want to reset your ritual? This cannot be undone.")) {
            setStartDate(null);
            setCompletedCells([]);
            localStorage.removeItem("nawin_startDate");
            localStorage.removeItem("nawin_completedCells");
        }
    };

    const saveCompletion = (cellId: string) => {
        if (!completedCells.includes(cellId)) {
            const newCompleted = [...completedCells, cellId];
            setCompletedCells(newCompleted);
            localStorage.setItem("nawin_completedCells", JSON.stringify(newCompleted));
        } else {
            const newCompleted = completedCells.filter(id => id !== cellId);
            setCompletedCells(newCompleted);
            localStorage.setItem("nawin_completedCells", JSON.stringify(newCompleted));
        }
    };

    const getCellId = (row: number, col: number) => `${row}-${col}`;

    const getCellDate = (row: number, col: number) => {
        if (!startDate) return null;
        const start = new Date(startDate);
        // Adjust for timezone to ensure we start counting from the selected calendar date
        const userTimezoneOffset = start.getTimezoneOffset() * 60000;
        const localStart = new Date(start.getTime() + userTimezoneOffset);

        // Calculate total days offset: (Row-1)*9 + (Col-1)
        const offset = ((row - 1) * 9) + (col - 1);
        const cellDate = new Date(localStart);
        cellDate.setDate(localStart.getDate() + offset);
        return cellDate;
    };

    const isCellUnlocked = (row: number, col: number) => {
        if (row === 1 && col === 1) return true;
        if (col > 1) return completedCells.includes(getCellId(row, col - 1));
        if (col === 1 && row > 1) return completedCells.includes(getCellId(row - 1, 9));
        return false;
    };

    const handleCellClick = (row: number, col: number) => {
        if (isCellUnlocked(row, col)) {
            saveCompletion(getCellId(row, col));
        }
    };

    // Setup Screen
    if (isClient && !startDate) {
        return (
            <div className="w-full max-w-md mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 text-center backdrop-blur-sm">
                <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6 text-blue-200">
                    <Calendar size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Begin Your Journey</h2>
                <p className="text-white/60 text-sm mb-8">
                    The Ko Nawin ritual must begin on a <strong>Monday</strong>. Please select your start date below.
                </p>
                <input
                    type="date"
                    className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white mb-6 w-full text-center focus:outline-none focus:border-blue-500 transition-colors"
                    onChange={(e) => handleStartSetup(e.target.value)}
                />
                <p className="text-xs text-white/30">
                    Choose a Monday to enable the 'Start' button
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="flex justify-end mb-4">
                <button
                    onClick={resetProgress}
                    className="text-white/30 text-xs hover:text-red-400 transition-colors"
                >
                    Reset Ritual
                </button>
            </div>

            <div className="w-full overflow-x-auto pb-12">
                <div className="min-w-[900px] bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                    {/* Header Row */}
                    <div className="grid grid-cols-10 gap-2 mb-4 text-center font-bold text-white/40 text-xs uppercase tracking-wider">
                        <div className="text-left pl-2">Attribute</div>
                        {[...Array(9)].map((_, i) => (
                            <div key={i}>Day {i + 1}</div>
                        ))}
                    </div>

                    {/* Matrix Rows */}
                    {nawinAttributes.map((attr) => (
                        <div key={attr.id} className="grid grid-cols-10 gap-2 mb-3 items-stretch">
                            {/* Row Label */}
                            <div className="font-bold text-white/80 text-sm pl-2 flex flex-col justify-center">
                                <span className="truncate" title={attr.meaning}>{attr.pali}</span>
                                <span className="text-[10px] text-white/30 font-normal">Level {attr.id}</span>
                            </div>

                            {/* Cells */}
                            {[...Array(9)].map((_, i) => {
                                const col = i + 1;
                                const cellId = getCellId(attr.id, col);
                                const isDone = isClient && completedCells.includes(cellId);
                                const isUnlocked = isClient && isCellUnlocked(attr.id, col);
                                const date = getCellDate(attr.id, col);
                                const isVeggie = col === 5; // Day 5 is Vegetarian

                                return (
                                    <motion.button
                                        key={cellId}
                                        whileHover={isUnlocked ? { scale: 1.05 } : {}}
                                        whileTap={isUnlocked ? { scale: 0.95 } : {}}
                                        onClick={() => handleCellClick(attr.id, col)}
                                        className={`
                        aspect-square rounded-md flex flex-col items-center justify-center border transition-all relative
                        ${isDone
                                                ? "bg-green-500/20 border-green-500/50 text-green-400"
                                                : isUnlocked
                                                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/40 cursor-pointer"
                                                    : "bg-black/20 border-white/5 text-white/10 cursor-not-allowed"
                                            }
                    `}
                                    >
                                        {/* Veggie Indicator */}
                                        {isVeggie && (
                                            <div className="absolute top-1 right-1 text-[8px]" title="Vegetarian Day">
                                                <Leaf size={8} className={isDone ? "text-green-400" : "text-green-200/60"} fill="currentColor" />
                                            </div>
                                        )}

                                        {isDone ? (
                                            <Check size={16} strokeWidth={3} />
                                        ) : (
                                            <>
                                                <span className={`text-xs font-bold ${isUnlocked ? "opacity-100" : "opacity-30"}`}>
                                                    {date ? date.toLocaleDateString('en-US', { weekday: 'short' }) : `Day ${col}`}
                                                </span>
                                                <span className="text-[9px] opacity-40 mt-0.5">
                                                    {date ? date.getDate() : ""}
                                                </span>
                                                {!isUnlocked && <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md"><Lock size={12} /></div>}
                                            </>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
