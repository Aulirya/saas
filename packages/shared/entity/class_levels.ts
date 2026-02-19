export const SUPPORTED_COUNTRIES = ["FR", "BE"] as const;
export type Country = (typeof SUPPORTED_COUNTRIES)[number];

/**
 * Class levels configuration per country
 * This follows the education system structure for each country
 */
export const CLASS_LEVELS_BY_COUNTRY: Record<Country, readonly string[]> = {
    FR: [
        // École primaire (Primary School)
        "CP", // Cours préparatoire
        "CE1", // Cours élémentaire 1
        "CE2", // Cours élémentaire 2
        "CM1", // Cours moyen 1
        "CM2", // Cours moyen 2
        // Collège (Middle School)
        "6ème",
        "5ème",
        "4ème",
        "3ème",
        // Lycée (High School)
        "2nde",
        "1ère",
        "Terminale",
    ] as const,
    BE: [
        // École primaire (Primary School)
        "1ère primaire",
        "2ème primaire",
        "3ème primaire",
        "4ème primaire",
        "5ème primaire",
        "6ème primaire",
        // École secondaire (Secondary School)
        "1ère secondaire",
        "2ème secondaire",
        "3ème secondaire",
        "4ème secondaire",
        "5ème secondaire",
        "6ème secondaire",
    ] as const,
};

/**
 * Get class levels for a specific country
 * Falls back to Belgium if country is not provided or not supported
 */
export function getClassLevelsForCountry(
    country: Country | null | undefined
): readonly string[] {
    if (!country || !SUPPORTED_COUNTRIES.includes(country)) {
        return CLASS_LEVELS_BY_COUNTRY.BE; // Default to France
    }
    return CLASS_LEVELS_BY_COUNTRY[country];
}
