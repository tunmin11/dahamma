import { NAWIN_DATA } from "../data/nawinMatrix";

export interface NawinDayInfo {
    day: number;
    level: number;
    levelName: string;
    dayLabel: string;
    mantra: string;
    rounds: number;
}

export function getNawinDayInfo(currentDayOfRitual: number): NawinDayInfo {
    // 1. Calculate Level: ceil(day / 9)
    const levelId = Math.ceil(currentDayOfRitual / 9);

    // 2. Calculate Day Index (0-8) within the level
    const sessionIndex = (currentDayOfRitual - 1) % 9;

    // 3. Find Level Data
    const levelData = NAWIN_DATA.levels.find(l => l.level_id === levelId);
    const session = levelData?.sessions[sessionIndex];

    return {
        day: currentDayOfRitual,
        level: levelId,
        levelName: levelData?.level_name || "",
        dayLabel: session?.day || "",
        mantra: session?.mantra || "",
        rounds: session?.rounds || 0
    };
}
