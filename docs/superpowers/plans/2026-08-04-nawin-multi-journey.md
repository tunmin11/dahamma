# Nawin Multi-Journey History & Catch-Up Unlock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a Nawin user start a new 81-day journey after completing one (while keeping a lightweight completion-date log), and let a user who enters a past start date see today's actual day unlocked immediately instead of tapping through every prior day.

**Architecture:** Both changes live in the existing client-rendered `app/components/NawinPath.tsx`, which already owns all Nawin state (`completedCells`, `startDate`) and its localStorage/Firestore sync. A new presentational component, `NawinJourneyComplete.tsx`, renders the completion screen, following the existing pattern of extracting standalone screens (see `ReminderSettings.tsx`, `NawinCounter.tsx`). No new Firestore collection — one new array field on the existing `users/{uid}` doc.

**Tech Stack:** Next.js 16 App Router, React, TypeScript (strict), Tailwind, framer-motion, lucide-react, Firebase Firestore (named db `"dhamma-app"`).

## Global Constraints

- TypeScript strict mode: no `any`, explicit types on new function signatures (per user's global CLAUDE.md), except where matching an existing pattern in this file that already uses `any` for caught errors (`e: any`) — match existing style for consistency within this file.
- No `console.log` in shipped code paths (existing file already uses `console.error` for caught Firestore errors on `resetProgress`/`handleDayComplete` — keep that pattern for the new code, don't introduce `console.log`).
- Follow the existing localStorage-then-Firestore-sync pattern already used for `nawin_startDate` / `nawin_completedCells` — don't introduce a different persistence mechanism.
- No test suite is configured in this repo (per project `CLAUDE.md`). Verification is: `npm run lint`, `npx tsc --noEmit`, and manual exercise via `npm run dev` as described in each task.
- Don't touch the Monday-start validation in `handleStartSetup`, `getNawinDayInfo`, `getCellDate`, or the Reset button's behavior — out of scope per the spec.

---

## File Structure

- **Create:** `app/components/NawinJourneyComplete.tsx` — presentational "Journey Complete" screen with a completion count and "Start New Journey" button. No state of its own; takes `journeyCount` and `onStartNew` as props.
- **Modify:** `app/components/NawinPath.tsx` — add `journeyLog` state + localStorage/Firestore sync, journey-completion detection, `handleStartNewJourney`, start-screen count display, and date-based unlock logic in `isCellUnlocked`.

---

### Task 1: Journey completion screen and history log

**Files:**
- Create: `app/components/NawinJourneyComplete.tsx`
- Modify: `app/components/NawinPath.tsx:1-32` (imports, state, initial localStorage load)
- Modify: `app/components/NawinPath.tsx:34-77` (Firestore `syncUser` effect)
- Modify: `app/components/NawinPath.tsx:119-143` (add `handleStartNewJourney` near `resetProgress`)
- Modify: `app/components/NawinPath.tsx:238-275` (start screen: show journey count)
- Modify: `app/components/NawinPath.tsx:277-278` (main view: insert completion-screen early return)

**Interfaces:**
- Produces: `NawinJourneyComplete` component — `interface NawinJourneyCompleteProps { journeyCount: number; onStartNew: () => void; }`, default export `NawinJourneyComplete`.
- Produces (in `NawinPath.tsx`): `journeyLog: { completedAt: string }[]` state; `handleStartNewJourney: () => void`.
- Consumes: existing `db`, `useAuth()`, `doc`/`getDoc`/`setDoc` from `firebase/firestore`, existing `completedCells`/`startDate`/`user` state and `setSyncStatus`.

- [ ] **Step 1: Create the `NawinJourneyComplete` component**

Create `app/components/NawinJourneyComplete.tsx`:

```tsx
"use client";

import { motion } from "framer-motion";
import { Sparkles, Trophy } from "lucide-react";

interface NawinJourneyCompleteProps {
    journeyCount: number;
    onStartNew: () => void;
}

export default function NawinJourneyComplete({ journeyCount, onStartNew }: NawinJourneyCompleteProps) {
    return (
        <div className="w-full max-w-md mx-auto px-4 mt-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
            >
                <div className="bg-gray-900 px-8 pt-10 pb-8 text-center">
                    <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-5 border-b-4 border-white/60">
                        <Trophy size={44} className="text-gray-800" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tight">JOURNEY COMPLETE</h2>
                    <p className="text-gray-400 text-sm mt-1 font-semibold">81 days · 9 levels · fully chanted</p>
                </div>
                <div className="p-6 text-center">
                    <p className="text-gray-500 text-sm mb-6 flex items-center justify-center gap-1.5">
                        <Sparkles size={14} className="text-gray-400" />
                        You&apos;ve completed {journeyCount} journey{journeyCount > 1 ? "s" : ""}
                    </p>
                    <button
                        onClick={onStartNew}
                        className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider text-white bg-gray-900 border-b-4 border-gray-700 hover:brightness-110 active:border-b-0 active:translate-y-1 transition-all"
                    >
                        Start New Journey
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
```

- [ ] **Step 2: Add `journeyLog` state and its initial localStorage load**

In `app/components/NawinPath.tsx`, add the import at the top (near the other component imports, after the `ReminderSettings` import):

```tsx
import NawinJourneyComplete from "./NawinJourneyComplete";
```

Add a new state field alongside the existing `completedCells`/`startDate` state (right after `const [startDate, setStartDate] = useState<string | null>(null);`):

```tsx
    const [journeyLog, setJourneyLog] = useState<{ completedAt: string }[]>([]);
```

In the first `useEffect` (the one that currently reads `nawin_completedCells` and `nawin_startDate` from localStorage), add a third read:

```tsx
    useEffect(() => {
        setIsClient(true);
        const savedCompleted = localStorage.getItem("nawin_completedCells");
        const savedDate = localStorage.getItem("nawin_startDate");
        const savedJourneyLog = localStorage.getItem("nawin_journeyLog");
        if (savedCompleted) setCompletedCells(JSON.parse(savedCompleted));
        if (savedDate) setStartDate(savedDate);
        if (savedJourneyLog) setJourneyLog(JSON.parse(savedJourneyLog));
    }, []);
```

- [ ] **Step 3: Extend the Firestore `syncUser` effect to sync `nawinJourneyLog`**

Replace the `syncUser` effect body so it also pulls down / pushes up `nawinJourneyLog`, mirroring the existing handling of `nawinCompleted`/`nawinStartDate`:

```tsx
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
```

- [ ] **Step 4: Add `handleStartNewJourney`**

Add this function right after `resetProgress` (after its closing `};`):

```tsx
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
```

- [ ] **Step 5: Show the journey count on the start screen**

In the "Start screen" block (`if (isClient && !startDate) { ... }`), inside the card's `<div className="p-6">`, right after the closing `</div>` of the XP/streak icon row (i.e. as the last child of `p-6`, after the `flex items-center justify-center gap-5 ...` div), add:

```tsx
                        {journeyLog.length > 0 && (
                            <p className="text-center text-xs font-bold text-gray-400 mt-4">
                                You&apos;ve completed {journeyLog.length} journey{journeyLog.length > 1 ? "s" : ""} before
                            </p>
                        )}
```

- [ ] **Step 6: Insert the completion-screen early return**

Right after the start-screen block's closing (`if (isClient && !startDate) { return ( ... ); }`) and before the `// ── Main view` comment, add:

```tsx
    // ── Journey complete screen ─────────────────────────────────────────────
    if (isClient && startDate && completedCells.length === 81) {
        return (
            <NawinJourneyComplete
                journeyCount={journeyLog.length + 1}
                onStartNew={handleStartNewJourney}
            />
        );
    }
```

- [ ] **Step 7: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 8: Manual verification**

Run: `npm run dev`, open `/nawin`.
1. In the browser devtools console, run:
   ```js
   localStorage.setItem("nawin_startDate", "2026-01-05"); // any past Monday
   localStorage.setItem("nawin_completedCells", JSON.stringify(
     Array.from({length: 9}, (_, r) => Array.from({length: 9}, (_, c) => `${r+1}-${c+1}`)).flat()
   ));
   ```
2. Reload `/nawin`. Confirm the "JOURNEY COMPLETE" screen appears showing "You've completed 1 journey".
3. Click "Start New Journey". Confirm it returns to the start-date picker screen, and that picking a date works normally (a fresh journey starts).
4. Reload `/nawin` again without setting a start date — confirm the start screen now shows "You've completed 1 journey before".
5. In devtools, confirm `localStorage.getItem("nawin_journeyLog")` contains one entry with a `completedAt` ISO string.

- [ ] **Step 9: Commit**

```bash
git add app/components/NawinJourneyComplete.tsx app/components/NawinPath.tsx
git commit -m "feat: add Nawin journey completion screen and history log"
```

---

### Task 2: Date-based catch-up unlock

**Files:**
- Modify: `app/components/NawinPath.tsx:147-152` (`isCellUnlocked`)

**Interfaces:**
- Consumes: existing `getCellDate(row, col)` (defined later in the same component, referenced only inside a function body so no temporal-dead-zone issue — matches how `currentActiveCellId` already calls `isCellUnlocked` before `getCellDate`'s definition site in the file).
- Produces: `isCellUnlocked(row: number, col: number): boolean` — same signature as before, now also true for cells whose calendar date has arrived.

- [ ] **Step 1: Update `isCellUnlocked` to unlock by date as well as by sequence**

Replace:

```tsx
    const isCellUnlocked = (row: number, col: number) => {
        if (row === 1 && col === 1) return true;
        if (col > 1) return completedCells.includes(getCellId(row, col - 1));
        if (col === 1 && row > 1) return completedCells.includes(getCellId(row - 1, 9));
        return false;
    };
```

with:

```tsx
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
```

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Run: `npm run dev`, open `/nawin`.
1. In devtools console, set a start date ~20 days in the past on a Monday and leave `nawin_completedCells` empty:
   ```js
   localStorage.setItem("nawin_startDate", "2026-07-13"); // a past Monday, adjust to ~20 days before today
   localStorage.removeItem("nawin_completedCells");
   ```
2. Reload `/nawin`. Confirm day cells whose calendar date is today or earlier show as unlocked (tappable, not showing the lock icon), even though none have been manually completed — while cells dated after today remain locked.
3. Tap one of the unlocked past-dated cells and confirm the day detail modal still opens and "Complete!" still works as before.
4. Confirm a cell dated in the future (beyond today) still shows the lock icon and does not open the modal on tap.

- [ ] **Step 4: Commit**

```bash
git add app/components/NawinPath.tsx
git commit -m "feat: unlock Nawin days by calendar date for users catching up manually"
```
