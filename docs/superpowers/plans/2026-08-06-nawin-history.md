# Nawin History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure Nawin ritual completion data in Firestore (timestamped per-day map instead of a plain cell-ID array, completed runs archived to a subcollection instead of an unbounded array field) and add a `/nawin/history` page to browse past journeys.

**Architecture:** The active run keeps living as flat fields on `users/{uid}` (`nawinStartDate`, `nawinCompleted`), but `nawinCompleted` changes shape from `string[]` to `Record<cellId, isoTimestamp | null>` so per-day completion time is captured. When a run finishes, a full snapshot is written to a new `users/{uid}/nawinRuns/{runId}` doc instead of array-pushing onto the user doc, and the active fields reset. A new page queries that subcollection to list and inspect past runs.

**Tech Stack:** Next.js App Router, TypeScript (strict), Firebase JS SDK v9 modular (`firebase/firestore`), Tailwind, lucide-react, framer-motion. No test framework in this repo — verification is manual (see spec's Testing section).

## Global Constraints

- TypeScript strict mode; explicit return types on functions; no `any` (existing files already violate this with `/* eslint-disable @typescript-eslint/no-explicit-any */` — don't spread that further, but don't need to fix pre-existing violations either).
- No `console.log` — use `console.error`/`console.warn` for diagnostics, matching existing code.
- Named exports over default exports, except page/layout components which Next.js requires as default exports (existing convention in this repo — follow it).
- `firestore.rules` already grants `users/{uid}/nawinRuns/{runId}` read/write to the owning uid — no rules changes needed in this plan.
- Firestore reads/writes always go through the named `"dhamma-app"` database via the shared `db` export from `app/firebase/config.ts`, and must check `auth.app`/`user` truthy first per existing pattern.

---

### Task 1: Shared Nawin-completion-map types and normalizer

**Files:**
- Create: `app/utils/nawinCompletedMap.ts`

**Interfaces:**
- Produces: `NawinCompletedMap = Record<string, string | null>`, `NawinRun { id: string; startDate: string; completedAt: string; days: NawinCompletedMap }`, `normalizeNawinCompleted(raw: unknown): NawinCompletedMap`.

- [ ] **Step 1: Write the file**

```ts
// app/utils/nawinCompletedMap.ts

/** cellId (e.g. "3-7") -> ISO completion timestamp, or null if unknown. */
export type NawinCompletedMap = Record<string, string | null>;

/** A single archived (completed) Nawin run, read back from Firestore. */
export interface NawinRun {
    id: string;
    startDate: string;
    completedAt: string;
    days: NawinCompletedMap;
}

/**
 * Normalizes stored Nawin completion data into a cellId -> ISO-timestamp
 * map, regardless of which shape it was saved in.
 *
 * - Legacy shape: `string[]` of cell IDs. No per-day timestamp was ever
 *   recorded for these, so each cell gets a `null` timestamp.
 * - Current shape: already a `Record<string, string>` map — passed through,
 *   with any non-string value defensively coerced to `null` rather than
 *   thrown on.
 * - Anything else (missing field, wrong type): returns `{}`.
 */
export function normalizeNawinCompleted(raw: unknown): NawinCompletedMap {
    if (Array.isArray(raw)) {
        const map: NawinCompletedMap = {};
        for (const cellId of raw) {
            if (typeof cellId === "string") map[cellId] = null;
        }
        return map;
    }
    if (raw && typeof raw === "object") {
        const map: NawinCompletedMap = {};
        for (const [cellId, value] of Object.entries(raw as Record<string, unknown>)) {
            map[cellId] = typeof value === "string" ? value : null;
        }
        return map;
    }
    return {};
}
```

- [ ] **Step 2: Verify manually**

Run: `npx tsx -e '
import { normalizeNawinCompleted } from "./app/utils/nawinCompletedMap";
console.log(normalizeNawinCompleted(["1-1","1-2"]));
console.log(normalizeNawinCompleted({"1-1":"2026-01-01T00:00:00Z"}));
console.log(normalizeNawinCompleted(undefined));
'`

Expected output:
```
{ '1-1': null, '1-2': null }
{ '1-1': '2026-01-01T00:00:00Z' }
{}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no new errors from `app/utils/nawinCompletedMap.ts`.

- [ ] **Step 4: Commit**

```bash
git add app/utils/nawinCompletedMap.ts
git commit -m "feat: add Nawin completion-map types and legacy-array normalizer"
```

---

### Task 2: Convert active-run completion state to a timestamped map

**Files:**
- Modify: `app/components/NawinPath.tsx`

**Interfaces:**
- Consumes: `NawinCompletedMap`, `normalizeNawinCompleted` from Task 1 (`app/utils/nawinCompletedMap.ts`).
- Produces: `completedCells` state is now `NawinCompletedMap` (was `string[]`) — later tasks (3, 6) read this shape.

This task only touches the **active run** read/write path (loading, completing/uncompleting a day, unlock checks, progress counts). It does not change how a finished journey is archived — that's Task 3.

- [ ] **Step 1: Add the import**

```ts
old_string:
import { arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Bell, Check, Flame, LayoutGrid, Leaf, Lock, Route, Shield, Star, Trophy, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { nawinAttributes } from "../data/nawin";
import { db } from "../firebase/config";
import { NawinDayInfo, getNawinDayInfo } from "../utils/nawinLogic";
import NawinJourneyComplete from "./NawinJourneyComplete";
import ReminderSettings from "./ReminderSettings";

new_string:
import { arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Bell, Check, Flame, LayoutGrid, Leaf, Lock, Route, Shield, Star, Trophy, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { nawinAttributes } from "../data/nawin";
import { db } from "../firebase/config";
import { NawinCompletedMap, normalizeNawinCompleted } from "../utils/nawinCompletedMap";
import { NawinDayInfo, getNawinDayInfo } from "../utils/nawinLogic";
import NawinJourneyComplete from "./NawinJourneyComplete";
import ReminderSettings from "./ReminderSettings";
```

- [ ] **Step 2: Change the state type and localStorage load**

```ts
old_string:
    const [completedCells, setCompletedCells] = useState<string[]>([]);
    const [startDate, setStartDate] = useState<string | null>(null);
    const [journeyLog, setJourneyLog] = useState<{ completedAt: string }[]>([]);
    const [showReminder, setShowReminder] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
    const [selectedDay, setSelectedDay] = useState<NawinDayInfo | null>(null);
    const [viewMode, setViewMode] = useState<'path' | 'grid'>('path');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [viewingCompletedPath, setViewingCompletedPath] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const savedCompleted = localStorage.getItem("nawin_completedCells");
        const savedDate = localStorage.getItem("nawin_startDate");
        const savedJourneyLog = localStorage.getItem("nawin_journeyLog");
        if (savedCompleted) setCompletedCells(JSON.parse(savedCompleted));
        if (savedDate) setStartDate(savedDate);
        if (savedJourneyLog) setJourneyLog(JSON.parse(savedJourneyLog));
    }, []);

new_string:
    const [completedCells, setCompletedCells] = useState<NawinCompletedMap>({});
    const [startDate, setStartDate] = useState<string | null>(null);
    const [journeyLog, setJourneyLog] = useState<{ completedAt: string }[]>([]);
    const [showReminder, setShowReminder] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
    const [selectedDay, setSelectedDay] = useState<NawinDayInfo | null>(null);
    const [viewMode, setViewMode] = useState<'path' | 'grid'>('path');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [viewingCompletedPath, setViewingCompletedPath] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const savedCompleted = localStorage.getItem("nawin_completedCells");
        const savedDate = localStorage.getItem("nawin_startDate");
        const savedJourneyLog = localStorage.getItem("nawin_journeyLog");
        if (savedCompleted) setCompletedCells(normalizeNawinCompleted(JSON.parse(savedCompleted)));
        if (savedDate) setStartDate(savedDate);
        if (savedJourneyLog) setJourneyLog(JSON.parse(savedJourneyLog));
    }, []);
```

- [ ] **Step 3: Fix the Firestore sync effect**

```ts
old_string:
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

new_string:
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        if (data.nawinCompleted) {
                            const normalized = normalizeNawinCompleted(data.nawinCompleted);
                            setCompletedCells(normalized);
                            localStorage.setItem("nawin_completedCells", JSON.stringify(normalized));
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
                        const localCompleted = Object.keys(completedCells).length > 0
                            ? completedCells
                            : normalizeNawinCompleted(JSON.parse(localStorage.getItem("nawin_completedCells") || "[]"));
                        const localDate = startDate || localStorage.getItem("nawin_startDate");
                        const localJourneyLog = journeyLog.length > 0
                            ? journeyLog
                            : JSON.parse(localStorage.getItem("nawin_journeyLog") || "[]");
                        if (Object.keys(localCompleted).length > 0 || localDate || localJourneyLog.length > 0) {
                            await setDoc(docRef, {
                                nawinCompleted: localCompleted,
                                nawinStartDate: localDate,
                                nawinJourneyLog: localJourneyLog,
                                updatedAt: new Date()
                            }, { merge: true });
                        }
                    }
```

- [ ] **Step 4: Fix the initial-scroll effect's completed count**

```ts
old_string:
    useEffect(() => {
        if (isClient && !hasInitialScrolled) {
            const totalCompleted = completedCells.length;

new_string:
    useEffect(() => {
        if (isClient && !hasInitialScrolled) {
            const totalCompleted = Object.keys(completedCells).length;
```

- [ ] **Step 5: Fix `resetProgress`**

```ts
old_string:
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

new_string:
            setStartDate(null);
            setCompletedCells({});
            localStorage.removeItem("nawin_startDate");
            localStorage.removeItem("nawin_completedCells");
            setHasInitialScrolled(false);
            if (user) {
                setSyncStatus('syncing');
                setDoc(doc(db, "users", user.uid), {
                    nawinStartDate: null,
                    nawinCompleted: {},
                    updatedAt: new Date()
                }, { merge: true })
```

- [ ] **Step 6: Fix `isCellUnlocked`**

```ts
old_string:
        const sequentiallyUnlocked = col > 1
            ? completedCells.includes(getCellId(row, col - 1))
            : row > 1 && completedCells.includes(getCellId(row - 1, 9));

new_string:
        const sequentiallyUnlocked = col > 1
            ? getCellId(row, col - 1) in completedCells
            : row > 1 && getCellId(row - 1, 9) in completedCells;
```

- [ ] **Step 7: Fix `handleDayComplete`**

```ts
old_string:
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

new_string:
    const handleDayComplete = () => {
        if (!selectedDay) return;
        const row = selectedDay.level;
        const col = ((selectedDay.day - 1) % 9) + 1;
        const cellId = getCellId(row, col);
        if (!(cellId in completedCells)) {
            const newCompleted = { ...completedCells, [cellId]: new Date().toISOString() };
            setCompletedCells(newCompleted);
            localStorage.setItem("nawin_completedCells", JSON.stringify(newCompleted));
            if (user) {
                setDoc(doc(db, "users", user.uid), {
                    nawinCompleted: newCompleted,
                    updatedAt: new Date()
                }, { merge: true }).catch((e) => console.error("❌ Failed to save:", e));
            }
        } else {
            const newCompleted = { ...completedCells };
            delete newCompleted[cellId];
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
```

- [ ] **Step 8: Fix `totalSteps`/`completedCount`, `currentActiveCellId`, and the journey-complete guard**

```ts
old_string:
    const totalSteps = 81;
    const completedCount = completedCells.length;
    const progressPercentage = (completedCount / totalSteps) * 100;

new_string:
    const totalSteps = 81;
    const completedCount = Object.keys(completedCells).length;
    const progressPercentage = (completedCount / totalSteps) * 100;
```

```ts
old_string:
                if (isCellUnlocked(row, col) && !completedCells.includes(cellId)) return cellId;

new_string:
                if (isCellUnlocked(row, col) && !(cellId in completedCells)) return cellId;
```

```ts
old_string:
    if (isClient && startDate && completedCells.length === 81 && !viewingCompletedPath) {

new_string:
    if (isClient && startDate && Object.keys(completedCells).length === 81 && !viewingCompletedPath) {
```

- [ ] **Step 9: Fix the day-detail modal's completed check**

```ts
old_string:
                            {completedCells.includes(getCellId(selectedDay.level, ((selectedDay.day - 1) % 9) + 1)) ? (

new_string:
                            {getCellId(selectedDay.level, ((selectedDay.day - 1) % 9) + 1) in completedCells ? (
```

- [ ] **Step 10: Fix the path-view stage-star and node `isDone` checks**

```ts
old_string:
                    const stageCompleted = [...Array(9)].filter((_, i) =>
                        completedCells.includes(getCellId(attr.id, i + 1))
                    ).length;

new_string:
                    const stageCompleted = [...Array(9)].filter((_, i) =>
                        getCellId(attr.id, i + 1) in completedCells
                    ).length;
```

```ts
old_string:
                    const isDone = isClient && completedCells.includes(cellId);
                    const isUnlocked = isClient && isCellUnlocked(attr.id, col);
                    const isCurrentActive = cellId === currentActiveCellId;
                    const isVeggie = col === 5;
                    const date = getCellDate(attr.id, col);

new_string:
                    const isDone = isClient && cellId in completedCells;
                    const isUnlocked = isClient && isCellUnlocked(attr.id, col);
                    const isCurrentActive = cellId === currentActiveCellId;
                    const isVeggie = col === 5;
                    const date = getCellDate(attr.id, col);
```

- [ ] **Step 11: Fix the grid-view `isDone` check**

```ts
old_string:
                                        const isDone = isClient && completedCells.includes(cellId);
                                        const isUnlocked = isClient && isCellUnlocked(attr.id, col);
                                        const isVeggie = col === 5;
                                        const globalDay = ((attr.id - 1) * 9) + col;

new_string:
                                        const isDone = isClient && cellId in completedCells;
                                        const isUnlocked = isClient && isCellUnlocked(attr.id, col);
                                        const isVeggie = col === 5;
                                        const globalDay = ((attr.id - 1) * 9) + col;
```

- [ ] **Step 12: Verify with the build**

Run: `npm run build`
Expected: builds successfully with no TypeScript errors referencing `NawinPath.tsx`.

- [ ] **Step 13: Manual verification**

Run: `npm run dev`, then in the browser:
1. Sign in, start a fresh Nawin run (pick a Monday).
2. Complete a day — confirm the node fills in immediately and stays filled after a page refresh.
3. Un-complete the same day — confirm it un-fills and refresh still shows it un-filled.
4. Open browser dev tools → Application → IndexedDB or just check the Firestore console for `users/{your uid}`: `nawinCompleted` should now be an object like `{"1-1": "<timestamp>"}`, not an array.
5. If you have an existing account with the old array-shaped `nawinCompleted` from before this change, confirm it still loads without console errors and previously-completed days still show as done.

- [ ] **Step 14: Commit**

```bash
git add app/components/NawinPath.tsx
git commit -m "feat: store Nawin day completions as a timestamped map"
```

---

### Task 3: Archive completed runs to the `nawinRuns` subcollection

**Files:**
- Modify: `app/components/NawinPath.tsx`

**Interfaces:**
- Consumes: `NawinCompletedMap` (Task 1), `completedCells` as `NawinCompletedMap` (Task 2).
- Produces: writes `users/{uid}/nawinRuns/{runId}` docs shaped `{ startDate: string, completedAt: string, days: NawinCompletedMap }` — Task 5's history page reads this exact shape via `NawinRun`.

- [ ] **Step 1: Swap the `arrayUnion` import for `increment`**

```ts
old_string:
import { arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";

new_string:
import { doc, getDoc, increment, setDoc } from "firebase/firestore";
```

- [ ] **Step 2: Rewrite `handleStartNewJourney` to archive instead of array-append**

```ts
old_string:
    const handleStartNewJourney = () => {
        const newEntry = { completedAt: new Date().toISOString() };
        const newLog = [...journeyLog, newEntry];
        setJourneyLog(newLog);
        setStartDate(null);
        setCompletedCells([]);
        setViewingCompletedPath(false);
        localStorage.setItem("nawin_journeyLog", JSON.stringify(newLog));
        localStorage.removeItem("nawin_startDate");
        localStorage.removeItem("nawin_completedCells");
        setHasInitialScrolled(false);
        if (user) {
            setSyncStatus('syncing');
            setDoc(doc(db, "users", user.uid), {
                nawinJourneyLog: arrayUnion(newEntry),
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

new_string:
    const handleStartNewJourney = () => {
        const completedAt = new Date().toISOString();
        const newEntry = { completedAt };
        const newLog = [...journeyLog, newEntry];
        const finishedStartDate = startDate;
        const finishedCompleted = completedCells;
        setJourneyLog(newLog);
        setStartDate(null);
        setCompletedCells({});
        setViewingCompletedPath(false);
        localStorage.setItem("nawin_journeyLog", JSON.stringify(newLog));
        localStorage.removeItem("nawin_startDate");
        localStorage.removeItem("nawin_completedCells");
        setHasInitialScrolled(false);
        if (user && finishedStartDate) {
            setSyncStatus('syncing');
            const runId = `run_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
            Promise.all([
                setDoc(doc(db, "users", user.uid, "nawinRuns", runId), {
                    startDate: finishedStartDate,
                    completedAt,
                    days: finishedCompleted,
                }),
                setDoc(doc(db, "users", user.uid), {
                    nawinStartDate: null,
                    nawinCompleted: {},
                    totalRuns: increment(1),
                    updatedAt: new Date()
                }, { merge: true }),
            ])
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

Note: `journeyLog`/`nawin_journeyLog` (local count-only log, shown as "You've completed N journeys before" on the start screen) is intentionally kept as-is — it's a lightweight local/offline counter, separate from the real per-run archive now living in `nawinRuns`. The Firestore field `nawinJourneyLog` is simply no longer written to (per the spec, it's retired but left in place unread on old docs).

- [ ] **Step 3: Verify with the build**

Run: `npm run build`
Expected: succeeds, no errors about unused `arrayUnion` import or missing `increment`.

- [ ] **Step 4: Manual verification**

Using a test account (or by temporarily marking all 81 cells complete in dev tools):
1. Complete all 81 days of a run and click "Start New Journey" on the completion screen.
2. In the Firestore console, confirm a new doc appeared under `users/{uid}/nawinRuns/{runId}` with `startDate`, `completedAt`, and a `days` map containing all 81 cell IDs with timestamps.
3. Confirm `users/{uid}` now has `nawinStartDate: null`, `nawinCompleted: {}`, and `totalRuns` incremented by 1.
4. Confirm the app returns to the "BEGIN YOUR QUEST" start screen and shows the updated "You've completed N journeys before" count.

- [ ] **Step 5: Commit**

```bash
git add app/components/NawinPath.tsx
git commit -m "feat: archive completed Nawin runs to a nawinRuns subcollection"
```

---

### Task 4: Fix home page's completed-count read

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `normalizeNawinCompleted` from `app/utils/nawinCompletedMap.ts` (Task 1).

- [ ] **Step 1: Add the import**

```ts
old_string:
import { db } from "./firebase/config";
import { getNawinDayInfo } from "./utils/nawinLogic";

new_string:
import { db } from "./firebase/config";
import { normalizeNawinCompleted } from "./utils/nawinCompletedMap";
import { getNawinDayInfo } from "./utils/nawinLogic";
```

- [ ] **Step 2: Fix the localStorage count**

```ts
old_string:
        if (localDate) {
            setHasStarted(true);
            if (localCompleted) setCompletedCount(JSON.parse(localCompleted).length);
        }

new_string:
        if (localDate) {
            setHasStarted(true);
            if (localCompleted) setCompletedCount(Object.keys(normalizeNawinCompleted(JSON.parse(localCompleted))).length);
        }
```

- [ ] **Step 3: Fix the Firestore count**

```ts
old_string:
                    if (data.nawinStartDate) {
                        setHasStarted(true);
                        if (data.nawinCompleted) setCompletedCount(data.nawinCompleted.length);
                    }

new_string:
                    if (data.nawinStartDate) {
                        setHasStarted(true);
                        if (data.nawinCompleted) setCompletedCount(Object.keys(normalizeNawinCompleted(data.nawinCompleted)).length);
                    }
```

- [ ] **Step 4: Verify with the build**

Run: `npm run build`
Expected: succeeds with no errors in `app/page.tsx`.

- [ ] **Step 5: Manual verification**

Run `npm run dev`, load the home page while signed in with an active run — confirm the "N/81" badge on the Ko Nawin card and the "Day N" next-step card show the same count as the Nawin path page itself.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "fix: read Nawin completed-day count from the new map shape on home page"
```

---

### Task 5: Build the `/nawin/history` page

**Files:**
- Create: `app/components/NawinRunDetail.tsx`
- Create: `app/nawin/history/page.tsx`

**Interfaces:**
- Consumes: `NawinRun`, `NawinCompletedMap` (Task 1); `nawinAttributes` from `app/data/nawin.ts`; `useAuth()` from `app/context/AuthContext.tsx`; `db` from `app/firebase/config.ts`.
- Produces: `NawinRunDetail({ run: NawinRun }): JSX.Element` — a 9×9 completion grid for one archived run.

- [ ] **Step 1: Write the run-detail grid component**

```tsx
// app/components/NawinRunDetail.tsx
"use client";

import { Star } from "lucide-react";
import { Fragment } from "react";
import { nawinAttributes } from "../data/nawin";
import { NawinRun } from "../utils/nawinCompletedMap";

function formatCellDate(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NawinRunDetail({ run }: { run: NawinRun }) {
    return (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 mt-3">
            <div className="grid grid-cols-[70px_repeat(9,1fr)] gap-1 text-[10px]">
                <div />
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="text-center font-black text-gray-400">{i + 1}</div>
                ))}
                {nawinAttributes.map((attr) => (
                    <Fragment key={attr.id}>
                        <div className="flex items-center font-black text-gray-500 truncate pr-1">
                            {attr.pali}
                        </div>
                        {[...Array(9)].map((_, i) => {
                            const col = i + 1;
                            const cellId = `${attr.id}-${col}`;
                            const timestamp = run.days[cellId];
                            const isDone = cellId in run.days;
                            return (
                                <div
                                    key={cellId}
                                    className={`aspect-square rounded-md flex flex-col items-center justify-center ${
                                        isDone
                                            ? `bg-gradient-to-br ${attr.color} text-white`
                                            : "bg-gray-100 text-gray-300"
                                    }`}
                                    title={isDone ? formatCellDate(timestamp) : undefined}
                                >
                                    {isDone && <Star size={10} fill="currentColor" />}
                                </div>
                            );
                        })}
                    </Fragment>
                ))}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Write the history page**

```tsx
// app/nawin/history/page.tsx
"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useState } from "react";
import NawinRunDetail from "../../components/NawinRunDetail";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase/config";
import { NawinRun } from "../../utils/nawinCompletedMap";

function daysBetween(startIso: string, endIso: string): number {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

export default function NawinHistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const [runs, setRuns] = useState<NawinRun[]>([]);
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const fetchRuns = async () => {
            setStatus("loading");
            try {
                const q = query(collection(db, "users", user.uid, "nawinRuns"), orderBy("completedAt", "desc"));
                const snap = await getDocs(q);
                setRuns(snap.docs.map((d) => ({ id: d.id, ...d.data() } as NawinRun)));
                setStatus("success");
            } catch (e) {
                console.error("Failed to load Nawin run history:", e);
                setStatus("error");
            }
        };
        fetchRuns();
    }, [user]);

    return (
        <div className="min-h-screen p-6 md:p-8 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <Link href="/nawin" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors">
                    <ArrowLeft size={18} />
                </Link>
                <h1 className="text-xl font-black text-gray-800">Past Journeys</h1>
            </div>

            {!authLoading && !user && (
                <p className="text-sm text-gray-500 text-center mt-10">Sign in to see your journey history.</p>
            )}

            {user && status === "loading" && (
                <p className="text-sm text-gray-400 text-center mt-10">Loading…</p>
            )}

            {user && status === "error" && (
                <div className="text-center mt-10">
                    <p className="text-sm text-red-500 mb-3">Couldn&apos;t load your journey history.</p>
                    <button
                        onClick={() => setStatus("idle")}
                        className="text-xs font-bold text-gray-500 underline underline-offset-2"
                    >
                        Try again
                    </button>
                </div>
            )}

            {user && status === "success" && runs.length === 0 && (
                <p className="text-sm text-gray-400 text-center mt-10">No completed journeys yet.</p>
            )}

            {user && status === "success" && runs.length > 0 && (
                <div className="space-y-3">
                    {runs.map((run, i) => {
                        const runNumber = runs.length - i;
                        const isExpanded = expandedRunId === run.id;
                        return (
                            <div key={run.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                                    className="w-full flex items-center justify-between gap-3 p-4 text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center text-white font-black text-xs">
                                            #{runNumber}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-800">
                                                <Calendar size={12} className="text-gray-400" />
                                                {new Date(run.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                {" → "}
                                                {new Date(run.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {daysBetween(run.startDate, run.completedAt)} days
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                </button>
                                {isExpanded && (
                                    <div className="px-4 pb-4">
                                        <NawinRunDetail run={run} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
```

- [ ] **Step 3: Verify with the build**

Run: `npm run build`
Expected: succeeds; `/nawin/history` appears in the route list in the build output.

- [ ] **Step 4: Manual verification**

Run `npm run dev`, sign in with the account used in Task 3's manual verification (it should have at least one archived run by now), navigate to `/nawin/history` directly in the browser:
1. Confirm the completed run appears as a card with correct start/finish dates and day count.
2. Click the card — confirm it expands to show the 9×9 grid with filled cells matching what was completed, and hovering a filled cell shows its completion date in a tooltip.
3. Sign out and revisit `/nawin/history` — confirm it shows the "Sign in to see your journey history" message instead of erroring.

- [ ] **Step 5: Commit**

```bash
git add app/components/NawinRunDetail.tsx app/nawin/history/page.tsx
git commit -m "feat: add /nawin/history page to browse past Nawin journeys"
```

---

### Task 6: Add "View past journeys" entry points

**Files:**
- Modify: `app/components/NawinPath.tsx`

**Interfaces:**
- Consumes: `/nawin/history` route (Task 5).

- [ ] **Step 1: Add the `Link` and `History` icon imports**

```ts
old_string:
import { motion } from "framer-motion";
import { Bell, Check, Flame, LayoutGrid, Leaf, Lock, Route, Shield, Star, Trophy, X, Zap } from "lucide-react";
import { useEffect, useState } from "react";

new_string:
import { motion } from "framer-motion";
import { Bell, Check, Flame, History, LayoutGrid, Leaf, Lock, Route, Shield, Star, Trophy, X, Zap } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
```

- [ ] **Step 2: Add the link on the start screen, next to the journey count**

```tsx
old_string:
                        {journeyLog.length > 0 && (
                            <p className="text-center text-xs font-bold text-gray-400 mt-4">
                                You&apos;ve completed {journeyLog.length} journey{journeyLog.length > 1 ? "s" : ""} before
                            </p>
                        )}

new_string:
                        {journeyLog.length > 0 && (
                            <p className="text-center text-xs font-bold text-gray-400 mt-4">
                                You&apos;ve completed {journeyLog.length} journey{journeyLog.length > 1 ? "s" : ""} before
                                {" — "}
                                <Link href="/nawin/history" className="underline underline-offset-2 hover:text-gray-600">
                                    view past journeys
                                </Link>
                            </p>
                        )}
```

- [ ] **Step 3: Add a history icon button to the active-run top bar**

```tsx
old_string:
                <button
                    onClick={() => setViewMode(prev => prev === 'path' ? 'grid' : 'path')}
                    className="p-2.5 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
                >
                    {viewMode === 'path' ? <LayoutGrid size={18} /> : <Route size={18} />}
                </button>

new_string:
                <button
                    onClick={() => setViewMode(prev => prev === 'path' ? 'grid' : 'path')}
                    className="p-2.5 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
                >
                    {viewMode === 'path' ? <LayoutGrid size={18} /> : <Route size={18} />}
                </button>

                <Link
                    href="/nawin/history"
                    className="p-2.5 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200 transition-colors"
                >
                    <History size={18} />
                </Link>
```

- [ ] **Step 4: Verify with the build**

Run: `npm run build`
Expected: succeeds with no errors in `app/components/NawinPath.tsx`.

- [ ] **Step 5: Manual verification**

Run `npm run dev`:
1. On the "BEGIN YOUR QUEST" start screen (with an account that has past journeys), confirm the "view past journeys" link is present and navigates to `/nawin/history`.
2. On the active-run path/grid view, confirm the history icon button appears in the top bar next to the layout-toggle button and navigates to `/nawin/history`.

- [ ] **Step 6: Commit**

```bash
git add app/components/NawinPath.tsx
git commit -m "feat: link to Nawin journey history from the path screen"
```
