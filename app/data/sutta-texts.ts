import { nidana } from "./texts/0-nidana";
import { mangala } from "./texts/1-mangala";
import { ratana } from "./texts/2-ratana";
import { metta } from "./texts/3-metta";
import { khandha } from "./texts/4-khandha";
import { mora } from "./texts/5-mora";
import { vatta } from "./texts/6-vatta";
import { dhajagga } from "./texts/7-dhajagga";
import { atanatiya } from "./texts/8-atanatiya";
import { angulimala } from "./texts/9-angulimala";
import { bojjhanga } from "./texts/10-bojjhanga";
import { pubbanha } from "./texts/11-pubbanha";

export interface SuttaText {
    id: number;
    pali: string;
    myanmar: string;
    config?: {
        scrollStart?: number;
        scrollDuration?: number;
    };
}

const createPlaceholder = (id: number, title: string): SuttaText => ({
    id,
    pali: `${title} Pali text coming soon...`,
    myanmar: `${title} Myanmar translation coming soon...`,
    config: { scrollStart: 5 }
});

const texts: Record<number, SuttaText> = {
    0: nidana,
    1: mangala,
    2: ratana,
    3: metta,
    4: khandha,
    5: mora,
    6: vatta,
    7: dhajagga,
    8: atanatiya,
    9: angulimala,
    10: bojjhanga,
    11: pubbanha,
};

export function getSuttaText(id: number): SuttaText {
    return texts[id] || createPlaceholder(id, "Unknown");
}
