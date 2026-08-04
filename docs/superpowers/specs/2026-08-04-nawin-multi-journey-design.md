# Nawin: Multi-Journey History & Date-Based Catch-Up Unlock

## Problem

Today the Ko Nawin ritual tracker (`app/nawin/`) supports exactly one journey per user, stored as flat fields on the Firestore user doc (`nawinStartDate`, `nawinCompleted`). Finishing all 81 days doesn't do anything special, and the only way to start over is the "Reset" button, which wipes progress with no record kept. Two problems follow from this:

1. A user who completes the ritual has no way to start a new one without losing all history of having done it before.
2. A user migrating into the app after already chanting manually for some days has no way to reflect that — the unlock logic is strictly sequential (day *N* only unlocks once day *N-1* is marked complete), so they'd have to tap through every day they already did by hand.

## Goals

- Let a user start a new journey after fully completing one (81/81 days), while keeping a lightweight record of how many journeys they've completed and when.
- Let a user who starts the app mid-practice (already chanting manually) pick their real start date and have the app unlock up through today's actual day, without requiring them to mark every prior day complete first.
- Keep the existing Reset button's behavior unchanged (wipes current progress, no history entry).

## Non-goals

- No detailed per-day history for past journeys (no drill-in view of a finished journey's grid).
- No change to the Monday-only start date requirement.
- No auto-marking of days as complete based on date — completion is still an explicit user action per day.

## Data model changes

Extends the existing user Firestore doc (`users/{uid}`) and its localStorage mirror. No new collection.

- `nawinStartDate: string | null` — unchanged. Start date of the *current* journey.
- `nawinCompleted: string[]` — unchanged. Completed cell IDs (`"row-col"`) for the *current* journey.
- **New** `nawinJourneyLog: { completedAt: string }[]` — one entry appended each time a journey reaches 81/81 completed cells. `completedAt` is an ISO date string (`new Date().toISOString()`). The number of journeys completed is `nawinJourneyLog.length`.
- localStorage mirror: `nawin_journeyLog` (JSON-stringified array), following the same read/sync pattern as `nawin_completedCells` and `nawin_startDate`.

## Behavior changes

### 1. Journey completion & starting a new one

- A journey is considered complete when `completedCells.length === 81`.
- When complete, `NawinPath` replaces the normal path/grid view with a "Journey Complete!" screen showing:
  - The updated journey count (e.g. "You've completed 3 journeys").
  - A **Start New Journey** button.
- Tapping **Start New Journey**:
  1. Appends `{ completedAt: new Date().toISOString() }` to `nawinJourneyLog` (state + localStorage).
  2. Clears `nawinStartDate` and `nawinCompleted` (state + localStorage), same clearing behavior as today's Reset.
  3. Syncs the updated `nawinJourneyLog`, `nawinStartDate: null`, `nawinCompleted: []` to Firestore in one `setDoc` (merge: true) call, mirroring the existing sync pattern (`syncStatus` states, error alert on failure).
  4. Returns the user to the existing "pick your Monday" start screen.
- The start screen shows the journey count line ("You've completed N journeys") only when `nawinJourneyLog.length > 0`; first-time users see no change.
- The manual **Reset** button/flow is untouched: it wipes `nawinStartDate`/`nawinCompleted` with the existing confirm dialog and does not touch `nawinJourneyLog`.

### 2. Date-based catch-up unlocking

- `isCellUnlocked(row, col)` changes from purely sequential to: unlocked if **either**
  - (a) the existing sequential rule (first cell, or previous cell in sequence is completed), **or**
  - (b) the cell's calendar date (via the existing `getCellDate(row, col)`) is today or earlier.
- This lets a user who enters a past start date see today's actual ritual day unlocked immediately, without tapping through every prior day. They can still go back and mark earlier days complete for their own record — nothing is hidden, just no longer gated by sequential completion for past dates.
- Days whose calendar date is in the future remain locked regardless of completion state elsewhere, preserving one-day-at-a-time pacing going forward.
- No change to how a day gets marked complete (`handleDayComplete`), to the Monday-start validation in `handleStartSetup`, or to `getNawinDayInfo`/`getCellDate`.

## Error handling

Follows existing patterns in `NawinPath.tsx`: Firestore writes on the completion→new-journey transition use the same `setSyncStatus`/alert-on-`permission-denied`-or-generic-error handling already used by `handleStartSetup` and `resetProgress`.

## Testing

No test suite is configured in this repo (per `CLAUDE.md`). Verification will be manual: exercise via `npm run dev` — complete a journey (or seed `nawinCompleted` with all 81 cell IDs) to confirm the completion screen and journey log increment, and set a past start date to confirm catch-up unlock behavior.
