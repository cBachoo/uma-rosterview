import type { CharaData } from "../types";

/**
 * Normalize raw JSON data from any extractor format into CharaData[].
 *
 * Handles:
 * - Plain array: [ { card_id: ... }, ... ]
 * - Object-wrapped: { viewer_id: ..., chara_array: [ ... ] }
 * - Missing create_time (old/new extractors)
 * - Missing chara_seed (new extractors use trained_chara_id instead)
 */
export function normalizeRosterData(raw: unknown): CharaData[] {
    let array: any[];

    if (Array.isArray(raw)) {
        array = raw;
    } else if (raw && typeof raw === "object") {
        // Wrapped format — find the first array property with card_id entries
        array =
            (Object.values(raw) as any[]).find(
                (v): v is any[] =>
                    Array.isArray(v) &&
                    v.length > 0 &&
                    v[0]?.card_id !== undefined,
            ) ?? [];
    } else {
        return [];
    }

    return array.map((c) => ({
        ...c,
        create_time: c.create_time ?? c.CreateTime ?? undefined,
        chara_seed: c.chara_seed ?? c.trained_chara_id,
    }));
}
