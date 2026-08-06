# Nawin data restructuring + journey history page

Date: 2026-08-06
Status: Approved

## Problem

Firestore has a single collection (`users/{uid}`), with all Nawin ritual state
(`nawinCompleted`, `nawinStartDate`, `nawinJourneyLog`, `activeRunId`,
`totalRuns`) flattened as top-level fields alongside profile fields
(`displayName`, `email`, `photoURL`). Completed journeys accumulate as an
array of `{ completedAt }` objects in `nawinJourneyLog`, which the UI only
ever reads to show a count — the entries themselves aren't browsable, and
no per-day detail (which day was completed when) survives once a run ends.

Scope: Nawin only. Paritta/Pahtan/other features have no Firestore sync
today and are out of scope.

## Data model

`users/{uid}` — unchanged as the profile + *active run* doc:
- `displayName`, `email`, `photoURL`, `updatedAt`, `totalRuns` — profile /
  counters, unchanged.
- `nawinStartDate` — unchanged.
- `nawinCompleted` — **changed** from an array of cell IDs
  (`["1-1", "1-2", ...]`) to a map of cell ID → ISO completion timestamp
  (`{ "1-1": "2026-08-01T09:00:00Z", ... }`), so per-day timing is captured
  while the run is active.
- `nawinJourneyLog` — retired. No longer written. Left in place (unread) on
  existing docs rather than migrated, since old entries only carry
  `completedAt` and can't be turned into a real run record.

New subcollection `users/{uid}/nawinRuns/{runId}` — one doc per **completed**
run:
```
{
  startDate: "2026-01-05",
  completedAt: <timestamp>,
  days: { "1-1": "<ISO ts>", "1-2": "<ISO ts>", ... }  // full 81-cell map
}
```
`runId` format: `run_<timestamp>_<random suffix>` (matches the existing
`activeRunId` convention already seen in the live user doc).

Security rules: `users/{uid}/nawinRuns/{runId}` read/write already scoped to
the owning uid in `firestore.rules` — no rule changes needed. (Note: that
file currently has a duplicate `match /users/{uid}/nawinRuns/{runId}` block
outside the `documents` match, which is inert/ignored — worth a cleanup pass
some other time, not part of this change.)

## Migration / backward compatibility

- On load in `NawinPath.tsx`, if `nawinCompleted` comes back as an array
  (old shape), convert it to a map with `null` timestamps for each existing
  cell ID before using it. No backfill of real timestamps for
  already-completed cells — acceptable since that data was never captured.
- Guard the conversion so a malformed/unexpected shape doesn't throw —
  fall back to an empty map/object rather than crashing the page.
- `app/page.tsx` reads `data.nawinCompleted.length` for the home-page
  progress count — must change to `Object.keys(data.nawinCompleted).length`
  since it's no longer an array.

## Write-path changes (`app/components/NawinPath.tsx`)

- `handleDayComplete`: merge `{ [cellId]: new Date().toISOString() }` into
  the map on completion; delete that key on un-completion. Firestore write
  becomes a merged map update instead of an array replace.
- `isCellUnlocked` and all `completedCells.includes(cellId)` checks: switch
  to `cellId in completedCells` (object) instead of array `.includes`.
  `completedCells.length` counts become `Object.keys(completedCells).length`.
- `handleStartNewJourney`: instead of `arrayUnion` onto `nawinJourneyLog`,
  write a new doc to `users/{uid}/nawinRuns/{runId}` with
  `{ startDate, completedAt: now, days: nawinCompleted }`, then reset the
  active-run fields (`nawinStartDate: null`, `nawinCompleted: {}`) and
  increment `totalRuns`.

## New UI: `/nawin/history`

- New route: `app/nawin/history/page.tsx`.
- Data: query `users/{uid}/nawinRuns` ordered by `completedAt` descending.
- List view: one card per run showing run number (derived from position in
  the ordered list, most recent = highest), start date, finish date, and
  duration in days.
- Tapping a card expands to a simple 9×9 day grid (reusing the grid-view
  cell styling already in `NawinPath.tsx`) showing each of the 81 cells
  with its completion date from that run's `days` map.
- Entry points:
  - A "View past journeys →" link next to the existing journey count on the
    Nawin start screen (`NawinPath.tsx`, currently
    `You've completed {journeyLog.length} journey(s) before`).
  - A link/icon in the top bar of the active-run view.

## Error handling

- History page fetch failures: inline retry state, following the existing
  `syncStatus` (`idle | syncing | success | error`) convention already used
  in `NawinPath.tsx` — no new pattern introduced.
- Legacy-shape migration is defensive (type-checked before `Object.keys`/
  `.map`), never throws.

## Testing

No test suite is configured in this repo (per `CLAUDE.md`). Verification is
manual:
1. Existing account with old array-shaped `nawinCompleted` and populated
   `nawinJourneyLog` loads without errors; active-run UI still works
   (complete/uncomplete a day).
2. Fresh account: start a run, complete a few days, confirm Firestore write
   is a map with timestamps.
3. Complete a full 81-day run (or manually complete all cells in dev),
   confirm a `nawinRuns/{runId}` doc is created with the right `days` map
   and the active fields reset.
4. Visit `/nawin/history`, confirm the completed run(s) list, and that
   expanding a card shows correct per-day dates.
5. Home page (`app/page.tsx`) progress count still reflects
   `nawinCompleted` correctly after the shape change.
