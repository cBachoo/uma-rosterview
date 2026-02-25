import TerumiCharacterData from "../assets/TerumiCharacterData.json";

export interface CharacterAptitudes {
  turf: number;
  dirt: number;
  sprint: number;
  mile: number;
  medium: number;
  long: number;
  frontRunner: number;
  paceChaser: number;
  lateSurger: number;
  endCloser: number;
}

const gradeToNum: Record<string, number> = {
  A: 8,
  B: 7,
  C: 6,
  D: 5,
  E: 4,
  F: 3,
  G: 2,
};

export const numToGrade: Record<number, string> = {
  8: "A",
  7: "B",
  6: "C",
  5: "D",
  4: "E",
  3: "F",
  2: "G",
};

export const characterAptitudesByCardId: Map<number, CharacterAptitudes> =
  new Map(
    (TerumiCharacterData as unknown as any[]).map((card) => [
      card.cardId,
      {
        turf: gradeToNum[card.aptitudeTurf] ?? 2,
        dirt: gradeToNum[card.aptitudeDirt] ?? 2,
        sprint: gradeToNum[card.aptitudeShort] ?? 2,
        mile: gradeToNum[card.aptitudeMile] ?? 2,
        medium: gradeToNum[card.aptitudeMiddle] ?? 2,
        long: gradeToNum[card.aptitudeLong] ?? 2,
        frontRunner: gradeToNum[card.aptitudeRunner] ?? 2,
        paceChaser: gradeToNum[card.aptitudeLeader] ?? 2,
        lateSurger: gradeToNum[card.aptitudeBetweener] ?? 2,
        endCloser: gradeToNum[card.aptitudeChaser] ?? 2,
      },
    ]),
  );

export const sparkStatToAptKey: Record<string, keyof CharacterAptitudes> = {
  Turf: "turf",
  Dirt: "dirt",
  Sprint: "sprint",
  Mile: "mile",
  Medium: "medium",
  Long: "long",
  "Front Runner": "frontRunner",
  "Pace Chaser": "paceChaser",
  "Late Surger": "lateSurger",
  "End Closer": "endCloser",
};

function getRaises(stars: number): number {
  if (stars >= 10) return 4;
  if (stars >= 7) return 3;
  if (stars >= 4) return 2;
  if (stars >= 1) return 1;
  return 0;
}

export interface AptitudeRaiseResult {
  stat: string;
  baseGrade: string;
  raisedGrade: string;
  stars: number;
}

/**
 * Calculate aptitude raises for a character based on accumulated pink spark stars
 * from their ancestors (GPs for parents, GGPs for GPs).
 *
 * Raising chart: 1★=+1rank, 4★=+2ranks, 7★=+3ranks, 10★=+4ranks, capped at A(8).
 */
export function calculateAptitudeRaises(
  cardId: number,
  ancestorPinkSparks: Array<{ stat: string; level: number } | undefined | null>,
): AptitudeRaiseResult[] {
  const aptitudes = characterAptitudesByCardId.get(cardId);
  if (!aptitudes) return [];

  // Accumulate stars per aptitude stat
  const starsByStat: Record<string, number> = {};
  for (const spark of ancestorPinkSparks) {
    if (!spark?.stat || typeof spark.level !== "number" || spark.level <= 0)
      continue;
    starsByStat[spark.stat] = (starsByStat[spark.stat] || 0) + spark.level;
  }

  const results: AptitudeRaiseResult[] = [];
  for (const [stat, stars] of Object.entries(starsByStat)) {
    if (stars <= 0) continue;
    const aptKey = sparkStatToAptKey[stat];
    if (!aptKey) continue;
    const baseVal = aptitudes[aptKey];
    const raises = getRaises(stars);
    const raisedVal = Math.min(8, baseVal + raises);
    if (raisedVal > baseVal) {
      results.push({
        stat,
        baseGrade: numToGrade[baseVal] || "?",
        raisedGrade: numToGrade[raisedVal] || "A",
        stars,
      });
    }
  }
  return results;
}
