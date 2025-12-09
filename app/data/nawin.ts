export interface NawinAttribute {
    id: number;
    pali: string;
    meaning: string;
    description: string;
    requiredCounts: number; // e.g. 108 * 9
    color: string;
}

export const nawinAttributes: NawinAttribute[] = [
    {
        id: 1,
        pali: "ပထမအဆင့်",
        meaning: "First Stage",
        description: "Ko Nawin Journey - Stage 1",
        requiredCounts: 108 * 9,
        color: "from-blue-500 to-indigo-600",
    },
    {
        id: 2,
        pali: "ဒုတိယအဆင့်",
        meaning: "Second Stage",
        description: "Ko Nawin Journey - Stage 2",
        requiredCounts: 108 * 9,
        color: "from-indigo-500 to-purple-600",
    },
    {
        id: 3,
        pali: "တတိယအဆင့်",
        meaning: "Third Stage",
        description: "Ko Nawin Journey - Stage 3",
        requiredCounts: 108 * 9,
        color: "from-purple-500 to-fuchsia-600",
    },
    {
        id: 4,
        pali: "စတုတ္ထအဆင့်",
        meaning: "Fourth Stage",
        description: "Ko Nawin Journey - Stage 4",
        requiredCounts: 108 * 9,
        color: "from-fuchsia-500 to-pink-600",
    },
    {
        id: 5,
        pali: "ပဉ္စမအဆင့်",
        meaning: "Fifth Stage",
        description: "Ko Nawin Journey - Stage 5",
        requiredCounts: 108 * 9,
        color: "from-pink-500 to-rose-600",
    },
    {
        id: 6,
        pali: "ဆဋ္ဌမအဆင့်",
        meaning: "Sixth Stage",
        description: "Ko Nawin Journey - Stage 6",
        requiredCounts: 108 * 9,
        color: "from-rose-500 to-red-600",
    },
    {
        id: 7,
        pali: "သတ္တမအဆင့်",
        meaning: "Seventh Stage",
        description: "Ko Nawin Journey - Stage 7",
        requiredCounts: 108 * 9,
        color: "from-red-500 to-orange-600",
    },
    {
        id: 8,
        pali: "အဋ္ဌမအဆင့်",
        meaning: "Eighth Stage",
        description: "Ko Nawin Journey - Stage 8",
        requiredCounts: 108 * 9,
        color: "from-orange-500 to-amber-600",
    },
    {
        id: 9,
        pali: "နဝမအဆင့်",
        meaning: "Ninth Stage",
        description: "Ko Nawin Journey - Stage 9",
        requiredCounts: 108 * 9,
        color: "from-amber-500 to-yellow-600",
    },
];
