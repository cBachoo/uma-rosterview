import type { CharaData } from "../types";

interface SparkData {
  stat: string;
  level: number;
}

const BASE_CHANCE: Record<string, Record<number, number>> = {
  blueSpark: { 1: 70, 2: 80, 3: 90 },
  pinkSpark: { 1: 1, 2: 3, 3: 5 },
  greenSpark: { 1: 5, 2: 10, 3: 15 },
  whiteSpark: { 1: 3, 2: 6, 3: 9 },
};

export function getSparkChance(
  spark: SparkData,
  affinity: number,
  type: keyof typeof BASE_CHANCE,
): number {
  // Validate inputs to prevent NaN
  if (
    !spark ||
    typeof spark.level !== "number" ||
    spark.level < 1 ||
    spark.level > 3
  ) {
    return 0;
  }
  if (typeof affinity !== "number" || isNaN(affinity)) {
    affinity = 0;
  }

  const baseChance = BASE_CHANCE[type]?.[spark.level];
  if (!baseChance) {
    return 0;
  }

  return Math.min(100, baseChance * (1 + affinity / 100));
}

function getChanceNotHappenPerInspiration(chance: number): number {
  return 100 - chance;
}

function getChanceNotHappenInTotal(chances: number[]): number {
  return chances.reduce(
    (acc, chance) => (acc * getChanceNotHappenPerInspiration(chance)) / 100,
    100,
  );
}

function getChanceHappenAtLeastOnce(chances: number[]): number {
  // Two inspirations per career
  return 100 - Math.pow(getChanceNotHappenInTotal(chances), 2) / 100;
}

interface SparkWithChances {
  stat: string;
  chances: number[];
  type: string;
}

export interface SparkProcResult {
  stat: string;
  chanceAtLeastOnce: number;
  type: string;
}

/**
 * Calculate spark proc chances for p0 based on parent/grandparent sparks
 */
export function calculateSparkProcs(
  parent1: { uma: any; affinity: number } | null,
  parent2: { uma: any; affinity: number } | null,
  gp1_1: any | null,
  gp1_2: any | null,
  gp2_1: any | null,
  gp2_2: any | null,
  gp1Affinity: number,
  gp2Affinity: number,
  gp3Affinity: number,
  gp4Affinity: number,
): Record<string, SparkProcResult> {
  const sparkMap = new Map<string, SparkWithChances>();

  // Helper to process sparks from an uma with affinity
  function processSparks(uma: any, affinity: number, isParent: boolean) {
    if (!uma) return;

    // Process blue spark
    if (uma.blueSpark && typeof uma.blueSpark.stat === "string") {
      const chance = getSparkChance(uma.blueSpark, affinity, "blueSpark");
      const key = uma.blueSpark.stat;
      if (!sparkMap.has(key)) {
        sparkMap.set(key, { stat: key, chances: [], type: "blueSpark" });
      }
      sparkMap.get(key)!.chances.push(chance);
    }

    // Process pink spark
    if (uma.pinkSpark && typeof uma.pinkSpark.stat === "string") {
      const chance = getSparkChance(uma.pinkSpark, affinity, "pinkSpark");
      const key = uma.pinkSpark.stat;
      if (!sparkMap.has(key)) {
        sparkMap.set(key, { stat: key, chances: [], type: "pinkSpark" });
      }
      sparkMap.get(key)!.chances.push(chance);
    }

    // Process green spark
    if (uma.greenSpark && typeof uma.greenSpark.stat === "string") {
      const chance = getSparkChance(uma.greenSpark, affinity, "greenSpark");
      const key = uma.greenSpark.stat;
      if (!sparkMap.has(key)) {
        sparkMap.set(key, { stat: key, chances: [], type: "greenSpark" });
      }
      sparkMap.get(key)!.chances.push(chance);
    }

    // Process white sparks
    // Note: uma.races (G1 race wins) are intentionally excluded — race wins are not
    // guaranteed to grant a skill, so they don't contribute to inspiration chance.
    // If a race-won skill is desired in the calculation, add it manually in the Skills tab.
    if (uma.whiteSpark && Array.isArray(uma.whiteSpark)) {
      uma.whiteSpark.forEach((spark: SparkData) => {
        if (!spark.stat || typeof spark.stat !== "string") return;
        const chance = getSparkChance(spark, affinity, "whiteSpark");
        const key = spark.stat;
        if (!sparkMap.has(key)) {
          sparkMap.set(key, { stat: key, chances: [], type: "whiteSpark" });
        }
        sparkMap.get(key)!.chances.push(chance);
      });
    }
  }

  // Process parent 1 and its grandparents
  if (parent1) {
    processSparks(parent1.uma, parent1.affinity, true);
    processSparks(gp1_1, gp1Affinity, false);
    processSparks(gp1_2, gp2Affinity, false);
  }

  // Process parent 2 and its grandparents
  if (parent2) {
    processSparks(parent2.uma, parent2.affinity, true);
    processSparks(gp2_1, gp3Affinity, false);
    processSparks(gp2_2, gp4Affinity, false);
  }

  // Calculate final chances
  const result: Record<string, SparkProcResult> = {};
  sparkMap.forEach((spark, key) => {
    result[key] = {
      stat: spark.stat,
      chanceAtLeastOnce: getChanceHappenAtLeastOnce(spark.chances),
      type: spark.type,
    };
  });

  return result;
}
