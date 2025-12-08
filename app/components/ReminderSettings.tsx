"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Bell, Clock, Leaf } from "lucide-react";

interface ReminderSettingsProps {
    onClose: () => void;
    startDate: string | null;
}

export default function ReminderSettings({ onClose, startDate }: ReminderSettingsProps) {
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [time, setTime] = useState("08:00");
    const [enabled, setEnabled] = useState(false);
    const [vgMsg, setVgMsg] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setPermission(Notification.permission);
            const savedTime = localStorage.getItem("nawin_reminderTime");
            const savedEnabled = localStorage.getItem("nawin_reminderEnabled") === "true";
            if (savedTime) setTime(savedTime);
            if (savedEnabled) setEnabled(savedEnabled);
        }

        // Calculate Tomorrow's Status
        if (startDate) {
            const start = new Date(startDate);
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            // Diff in days
            const diffTime = Math.abs(tomorrow.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // Note: diffDays is 1-based index if we consider startDate as Day 1? 
            // Let's align with NawinPath logic.
            // NawinPath uses calculated dates. 
            // If start = Mon Dec 1. Today = Mon Dec 1. Tomorrow = Tue Dec 2. 
            // Tue Dec 2 should be Day 2.
            // diffDays calculation needs to be precise.

            const oneDay = 24 * 60 * 60 * 1000;
            // User Timezone offset handling implies we should just compare dates roughly or stick to 00:00
            const startZero = new Date(start.setHours(0, 0, 0, 0));
            const tomorrowZero = new Date(tomorrow.setHours(0, 0, 0, 0));

            const dayIndex = Math.round((tomorrowZero.getTime() - startZero.getTime()) / oneDay) + 1;

            // Day 5 of any stage is Veggie. 
            // Stage = Math.ceil(dayIndex / 9). DayInStage = (dayIndex - 1) % 9 + 1.
            const dayInStage = (dayIndex - 1) % 9 + 1;

            if (dayInStage === 5) {
                setVgMsg("🌱 Tomorrow is a Vegetarian Day!");
            }
        }
    }, [startDate]);

    const handleEnable = async () => {
        if (!("Notification" in window)) {
            alert("This browser does not support notifications.");
            return;
        }

        if (permission !== "granted") {
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result !== "granted") return;
        }

        setEnabled(true);
        localStorage.setItem("nawin_reminderEnabled", "true");
    };

    const sendTestNotification = () => {
        if (permission === "granted") {
            const body = vgMsg ? `Reminder: Ritual time. Note: ${vgMsg}` : "Reminder: It's time for your Ko Nawin ritual.";
            new Notification("Ko Nawin Journey", {
                body: body,
                icon: "/icons/icon-192x192.png"
            });
        }
    };

    const handleDisable = () => {
        setEnabled(false);
        localStorage.setItem("nawin_reminderEnabled", "false");
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTime(e.target.value);
        localStorage.setItem("nawin_reminderTime", e.target.value);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white border border-gray-200 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative"
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                    <X size={20} />
                </button>

                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Bell size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Daily Reminder</h2>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                        <div>
                            <h3 className="font-bold text-gray-800">Enable Notifications</h3>
                            <p className="text-xs text-gray-500">Get reminded to perform your ritual</p>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => e.target.checked ? handleEnable() : handleDisable()}
                                className="sr-only peer"
                                id="toggle-reminders"
                            />
                            <label htmlFor="toggle-reminders" className="block w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 cursor-pointer"></label>
                        </div>
                    </div>

                    <div className={`transition-opacity ${enabled ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Reminder Time</label>
                        <div className="relative">
                            <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="time"
                                value={time}
                                onChange={handleTimeChange}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 text-gray-800 font-bold focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Smart Preview */}
                    {vgMsg && (
                        <div className="p-3 bg-green-50 rounded-lg border border-green-200 flex items-start gap-2">
                            <Leaf size={16} className="text-green-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-green-700 font-medium">
                                Smart Alert: Notifications will include "{vgMsg}" when applicable.
                            </p>
                        </div>
                    )}

                    {enabled && permission === "granted" && (
                        <div className="text-center">
                            <p className="text-xs text-green-600 mb-2">
                                ✓ Reminders active for {time}
                            </p>
                            <button onClick={sendTestNotification} className="text-[10px] text-blue-500 underline">
                                Send Test Notification
                            </button>
                        </div>
                    )}
                    {enabled && permission === "denied" && (
                        <p className="text-xs text-red-400 text-center">
                            ⚠ Notifications blocked by browser settings
                        </p>
                    )}
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                >
                    Done
                </button>
            </motion.div>
        </motion.div>
    );
}
