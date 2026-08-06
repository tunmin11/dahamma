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
