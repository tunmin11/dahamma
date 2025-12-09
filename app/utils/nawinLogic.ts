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

export function getNawinDayInfo(currentDayOfRitual: number): NawinDayInfo {
    // 1. Calculate Stage: ceil(day / 9)
    const stage = Math.ceil(currentDayOfRitual / 9);

    // 2. Calculate Day Index (0-8)
    const dayIndex = (currentDayOfRitual - 1) % 9;

    // Get label from meta (was planet, now Day 1..Monday..etc)
    const planet = NAWIN_DATA.meta.day_labels[dayIndex];

    // 3. Lookup Attribute and Beads
    const stageKey = String(stage) as keyof typeof NAWIN_DATA.stages;
    const stageData = NAWIN_DATA.stages[stageKey];

    // Construct day key: day_1, day_2...
    const dayKey = `day_${dayIndex + 1}` as keyof typeof stageData;
    const cellData = stageData ? stageData[dayKey] : undefined;

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
