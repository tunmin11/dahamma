import { NAWIN_DATA } from "../data/nawinMatrix";

export interface NawinDayInfo {
    day: number;
    stage: number;
    planet: string;
    attribute: string;
    burmese: string;
    beads: number;
}

// Fixed sequence matching (Day 1..9) -> (Mon..Ketu)
// Note: This order aligns with (day-1)%9 where 0=Mon.
export const PLANETS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun", "rahu", "ketu"];

export function getNawinDayInfo(currentDayOfRitual: number): NawinDayInfo {
    // 1. Calculate Stage: ceil(day / 9)
    const stage = Math.ceil(currentDayOfRitual / 9);

    // 2. Calculate Planet Index: (day - 1) % 9
    // Day 1 (Mon) -> 0, Day 2 (Tue) -> 1, ...
    const planetIndex = (currentDayOfRitual - 1) % 9;
    const planet = PLANETS[planetIndex];

    // 3. Lookup Attribute and Beads
    // Use type assertion or access strictly. 
    // Typescript might complain about string access on 'stages' if strict. 
    // We cast stage to keyof typeof NAWIN_DATA.stages or any.
    const stageKey = String(stage) as keyof typeof NAWIN_DATA.stages;
    const stageData = NAWIN_DATA.stages[stageKey];

    // Planet lookup
    // Cast planet to keyof typeof stageData
    // We know 'planet' is one of the keys from our PLANETS array which matches the keys in the JSON (except order).
    const cellData = stageData ? stageData[planet as keyof typeof stageData] : undefined;

    const attribute = cellData?.attribute || "Unknown";
    const burmese = cellData?.burmese || "";
    const beads = cellData?.beads || 0;

    return {
        day: currentDayOfRitual,
        stage,
        planet,
        attribute,
        burmese,
        beads
    };
}
