"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Lock, Leaf, Calendar, Bell } from "lucide-react";
import { nawinAttributes } from "../data/nawin";
import ReminderSettings from "./ReminderSettings";

export default function NawinPath() {
    const [completedCells, setCompletedCells] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [showReminder, setShowReminder] = useState(false);
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
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() + userTimezoneOffset);

        if (localDate.getDay() !== 1) {
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

    const getCellId = (row: number, col: number) => `${row}-${col}`;

    const isCellUnlocked = (row: number, col: number) => {
        if (row === 1 && col === 1) return true;
        if (col > 1) return completedCells.includes(getCellId(row, col - 1));
        if (col === 1 && row > 1) return completedCells.includes(getCellId(row - 1, 9));
        return false;
    };

    const handleCellClick = (row: number, col: number) => {
        const cellId = getCellId(row, col);
        if (!isCellUnlocked(row, col)) return;

        let newCompleted;
        if (completedCells.includes(cellId)) {
            newCompleted = completedCells.filter(id => id !== cellId);
        } else {
            newCompleted = [...completedCells, cellId];
        }
        setCompletedCells(newCompleted);
        localStorage.setItem("nawin_completedCells", JSON.stringify(newCompleted));
    };

    const getCellDate = (row: number, col: number) => {
        if (!startDate) return null;
        const start = new Date(startDate);
        const userTimezoneOffset = start.getTimezoneOffset() * 60000;
        const localStart = new Date(start.getTime() + userTimezoneOffset);
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
        return { x, y: index * ySpacing };
    };

    // Helper for Circular Progress
    const totalSteps = 81;
    const completedCount = completedCells.length;
    const progressPercentage = (completedCount / totalSteps) * 100;
    // SVG Circle Logic
    const circleRadius = 18;
    const circleCircumference = 2 * Math.PI * circleRadius;
    // This is purely for rendering, offset calculation is done in JSX

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
            {/* Top Controls & Progress */}
            <div className="sticky top-0 z-30 bg-[#F0EEE9]/90 backdrop-blur-md py-4 px-6 border-b border-black/5 flex justify-between items-center mb-6">
                <button onClick={() => setShowReminder(true)} className="p-2 bg-white/50 rounded-full text-gray-600 hover:bg-white hover:text-black transition-colors shadow-sm">
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

            <div className="space-y-12">
                {nawinAttributes.map((attr, attrIndex) => (
                    <div key={attr.id} className="relative">
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
