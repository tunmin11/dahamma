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
        pali: "Araham",
        meaning: "The Worthy One",
        description: "Free from defilements and impurities. Worthy of homage.",
        requiredCounts: 108 * 9,
        color: "from-blue-500 to-indigo-600",
    },
    {
        id: 2,
        pali: "Sammasambuddho",
        meaning: "Perfectly Self-Enlightened",
        description: "Discovered the Four Noble Truths by His own wisdom.",
        requiredCounts: 108 * 9,
        color: "from-indigo-500 to-purple-600",
    },
    {
        id: 3,
        pali: "Vijja Carana Sampanno",
        meaning: "Endowed with Knowledge and Conduct",
        description: "Possessing perfect wisdom and perfect practice.",
        requiredCounts: 108 * 9,
        color: "from-purple-500 to-fuchsia-600",
    },
    {
        id: 4,
        pali: "Sugato",
        meaning: "Well-Gone",
        description: "Speaker of the Truth, speaking only what is beneficial.",
        requiredCounts: 108 * 9,
        color: "from-fuchsia-500 to-pink-600",
    },
    {
        id: 5,
        pali: "Lokavidu",
        meaning: "Knower of Worlds",
        description: "Understanding the universe, the Dhamma, and all beings.",
        requiredCounts: 108 * 9,
        color: "from-pink-500 to-rose-600",
    },
    {
        id: 6,
        pali: "Anuttaro Purisadamma Sarathi",
        meaning: "Incomparable Trainer",
        description: "The supreme tamer of those to be tamed.",
        requiredCounts: 108 * 9,
        color: "from-rose-500 to-red-600",
    },
    {
        id: 7,
        pali: "Satta Deva Manussanam",
        meaning: "Teacher of Gods and Humans",
        description: "Guiding all beings towards liberation.",
        requiredCounts: 108 * 9,
        color: "from-red-500 to-orange-600",
    },
    {
        id: 8,
        pali: "Buddho",
        meaning: "The Awakened One",
        description: "Awakened from the sleep of ignorance.",
        requiredCounts: 108 * 9,
        color: "from-orange-500 to-amber-600",
    },
    {
        id: 9,
        pali: "Bhagava",
        meaning: "The Blessed One",
        description: "Possessing special glory and the six great qualities.",
        requiredCounts: 108 * 9,
        color: "from-amber-500 to-yellow-600",
    },
];
