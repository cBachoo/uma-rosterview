import racesDataRaw from "./assets/races.json";

/**
 * Race data interface matching the structure in races.json
 */
export interface Race {
  group_id: number;
  race_id: number;
  race_name: string;
  saddle_id: number;
}

/**
 * All races data as an array
 */
export const racesArray = racesDataRaw as Race[];

/**
 * Lookup map: saddle_id → Race
 * Used for quickly finding race information by saddle ID
 * This is needed for affinity calculations and displaying race victories
 */
export const racesBySaddleId = new Map<number, Race>(
  racesArray.map((race) => [race.saddle_id, race]),
);

/**
 * Lookup map: race_id → Race
 * Used for finding race information by race ID
 */
export const racesByRaceId = new Map<number, Race>(
  racesArray.map((race) => [race.race_id, race]),
);

/**
 * Lookup map: group_id → Race[]
 * Used for grouping races by their group ID
 */
export const racesByGroupId = racesArray.reduce((acc, race) => {
  if (!acc.has(race.group_id)) {
    acc.set(race.group_id, []);
  }
  acc.get(race.group_id)!.push(race);
  return acc;
}, new Map<number, Race[]>());

/**
 * Generate the thumbnail URL for a given race ID
 */
export function getRaceThumbnailUrl(raceId: number): string {
  return `/race_thumbnail/thum_race_rt_000_${raceId}_00.webp`;
}
