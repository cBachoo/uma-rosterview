import { factorsData, skillsData } from "../data";
import { racesBySaddleId } from "./races";
import type { CharaData } from "../types";

interface SparkData {
  stat: string;
  level: number;
}

interface ExtractedSparks {
  blueSpark?: SparkData;
  pinkSpark?: SparkData;
  greenSpark?: SparkData;
  whiteSpark?: SparkData[];
  races?: string[];
}

interface SparkDataWithType extends SparkData {
  isRace?: boolean;
}

// Map factor names to stat names
const statMapping: Record<string, string> = {
  スピード: "Speed",
  速度: "Speed",
  Speed: "Speed",
  スタミナ: "Stamina",
  持久力: "Stamina",
  Stamina: "Stamina",
  パワー: "Power",
  力: "Power",
  Power: "Power",
  根性: "Guts",
  ガッツ: "Guts",
  Guts: "Guts",
  賢さ: "Wits",
  知力: "Wits",
  Wits: "Wits",
};

const aptitudeMapping: Record<string, string> = {
  芝: "Turf",
  Turf: "Turf",
  ダート: "Dirt",
  Dirt: "Dirt",
  短距離: "Sprint",
  Sprint: "Sprint",
  マイル: "Mile",
  Mile: "Mile",
  中距離: "Medium",
  Medium: "Medium",
  長距離: "Long",
  Long: "Long",
  逃げ: "Front Runner",
  "Front Runner": "Front Runner",
  先行: "Pace Chaser",
  "Pace Chaser": "Pace Chaser",
  差し: "Late Surger",
  "Late Surger": "Late Surger",
  追込: "End Closer",
  "End Closer": "End Closer",
};

/**
 * Extract spark data from a CharaData object
 */
export function extractSparksFromCharaData(chara: CharaData): ExtractedSparks {
  const extracted: ExtractedSparks = {
    whiteSpark: [],
    races: [],
  };

  // Process factors
  if (chara.factor_id_array) {
    // Process each factor - extract highest rarity of each type
    chara.factor_id_array.forEach((factorId) => {
      const factor = factorsData[factorId];
      if (!factor) return;

      const level = factor.rarity || 1; // Use factor's rarity property

      switch (factor.type) {
        case 1: // Blue spark (Stats) - extract highest rarity
          const statName = statMapping[factor.name] || factor.name;
          if (!extracted.blueSpark || level > extracted.blueSpark.level) {
            extracted.blueSpark = { stat: statName, level };
          }
          break;

        case 2: // Pink spark (Aptitudes) - extract highest rarity
          const aptName = aptitudeMapping[factor.name] || factor.name;
          if (!extracted.pinkSpark || level > extracted.pinkSpark.level) {
            extracted.pinkSpark = { stat: aptName, level };
          }
          break;

        case 3: // Green spark (Unique skill)
          if (!extracted.greenSpark) {
            // Use the factor name which is the unique skill name
            extracted.greenSpark = { stat: factor.name, level };
          }
          break;

        case 4: // White spark (Skills)
        case 5: // White spark (Race)
        case 6: // White spark (Scenario)
          // Use factor name directly (like Factor.svelte does)
          if (factor.name) {
            const isRace = factor.type === 5;
            extracted.whiteSpark!.push({ stat: factor.name, level, isRace });
          }
          break;
      }
    });
  }

  // Process races won
  if (chara.win_saddle_id_array) {
    chara.win_saddle_id_array.forEach((saddleId) => {
      const race = racesBySaddleId.get(saddleId);
      if (race) {
        extracted.races!.push(race.race_name);
      }
    });
  }

  return extracted;
}
