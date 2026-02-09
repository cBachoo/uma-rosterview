import relationsData from "./assets/succession_relation.json";
import relationMembersData from "./assets/succession_relation_member.json";
import { charaCardsData } from "./data";
import type { CharaData, SuccessionCharaData } from "./types";

// Build lookup maps for efficient affinity calculations
const relationsByCharaId = new Map<string, Set<string>>();
const relationPoints = new Map<string, number>();

// Process relations.json to build point lookup
relationsData.forEach((relation) => {
  relationPoints.set(
    relation.relation_type.toString(),
    relation.relation_point,
  );
});

// Process relation_members.json to build chara -> relations lookup
relationMembersData.forEach((member) => {
  const charaIdStr = member.chara_id.toString();
  const relationTypeStr = member.relation_type.toString();
  if (!relationsByCharaId.has(charaIdStr)) {
    relationsByCharaId.set(charaIdStr, new Set());
  }
  relationsByCharaId.get(charaIdStr)!.add(relationTypeStr);
});

console.log(`[Affinity] Loaded ${relationPoints.size} relation types`);
console.log(
  `[Affinity] Loaded relations for ${relationsByCharaId.size} characters`,
);
console.log(
  `[Affinity] Sample chara IDs with relations:`,
  Array.from(relationsByCharaId.keys()).slice(0, 10),
);

/**
 * Calculate base affinity between 2 or 3 umas based on shared relations.
 *
 * For 2 umas: aff(x,y) = sum of points for relations shared by x and y
 * For 3 umas: aff(x,y,z) = sum of points for relations shared by all 3
 *
 * @param charaIds Array of chara_id values (length 2 or 3)
 * @returns Sum of relation points for shared relations
 */
export function calculateBaseAffinity(charaIds: string[]): number {
  if (charaIds.length < 2 || charaIds.length > 3) {
    return 0;
  }

  // Find shared relations across all provided chara IDs
  let sharedRelations: Set<string> | null = null;

  for (const charaId of charaIds) {
    const charaRelations = relationsByCharaId.get(charaId);
    if (!charaRelations || charaRelations.size === 0) {
      // If any uma has no relations, there can be no shared relations
      return 0;
    }

    if (sharedRelations === null) {
      // First uma - initialize with all its relations
      sharedRelations = new Set(charaRelations);
    } else {
      // Keep only relations that are in both sets
      sharedRelations = new Set(
        [...sharedRelations].filter((r) => charaRelations.has(r)),
      );
    }
  }

  // Sum up the points for all shared relations
  if (!sharedRelations || sharedRelations.size === 0) {
    return 0;
  }

  let totalPoints = 0;
  for (const relationType of sharedRelations) {
    totalPoints += relationPoints.get(relationType) || 0;
  }

  return totalPoints;
}

/**
 * Calculate shared race wins between two umas.
 * race(x,y) = number of duplicate win_saddle_id values between x and y
 *
 * @param winSaddleIds1 First uma's win_saddle_id_array
 * @param winSaddleIds2 Second uma's win_saddle_id_array
 * @returns Number of shared race wins
 */
export function calculateSharedRaces(
  winSaddleIds1: number[],
  winSaddleIds2: number[],
): number {
  const set1 = new Set(winSaddleIds1);
  let sharedCount = 0;

  for (const raceId of winSaddleIds2) {
    if (set1.has(raceId)) {
      sharedCount++;
    }
  }

  return sharedCount;
}

/**
 * Get chara_id from card_id using the charaCardsData lookup
 */
function getCharaId(cardId: number): string {
  const charaCard = charaCardsData[cardId];
  return charaCard ? charaCard.chara_id.toString() : "";
}

/**
 * Result of affinity calculation for breeding evaluation
 *
 * BREEDING LINEAGE STRUCTURE:
 * ============================
 * p0 = Target character (the NEW uma we want to breed)
 * p1 = Parent 1 (roster uma being evaluated)
 * p2 = Parent 2 (placeholder in single-parent mode)
 * p1.1 = p1's parent 1 (becomes p0's grandparent 1)
 * p1.2 = p1's parent 2 (becomes p0's grandparent 2)
 * p2.1 = p2's parent 1 (becomes p0's grandparent 3)
 * p2.2 = p2's parent 2 (becomes p0's grandparent 4)
 *
 * AFFINITY FORMULAS:
 * ==================================
 * p1_aff = aff(p0,p1) + aff(p1,p2) + aff(p1,p1.1) + aff(p1,p1.2)
 *          + race(p1,p2) + race(p1,p1.1) + race(p1,p1.2)
 *
 * p2_aff = aff(p0,p2) + aff(p1,p2) + aff(p2,p2.1) + aff(p2,p2.2)
 *          + race(p1,p2) + race(p2,p2.1) + race(p2,p2.2)
 *
 * p1.1_aff = aff(p0,p1,p1.1) + race(p1,p1.1)  [3-way affinity!]
 * p1.2_aff = aff(p0,p1,p1.2) + race(p1,p1.2)  [3-way affinity!]
 * p2.1_aff = aff(p0,p2,p2.1) + race(p2,p2.1)  [3-way affinity!]
 * p2.2_aff = aff(p0,p2,p2.2) + race(p2,p2.2)  [3-way affinity!]
 *
 * Note: Grandparent contributions are included in parent totals, not added separately.
 */
export interface AffinityResult {
  totalAffinity: number;
  breakdown: {
    p1: number; // Parent 1's total contribution (includes GP contributions)
    p2: number; // Parent 2's total contribution (includes GP contributions)
    p1_1: number; // Grandparent 1 contribution (for display only)
    p1_2: number; // Grandparent 2 contribution (for display only)
    p2_1: number; // Grandparent 3 contribution (for display only)
    p2_2: number; // Grandparent 4 contribution (for display only)
  };
}

/**
 * Calculate breeding affinity for a single uma as Parent 1.
 * Parent 2 is assumed to contribute 0 affinity (placeholder).
 *
 * BREEDING LINEAGE:
 * ==================
 * p0 = Target character (the NEW uma we want to breed, selected by user)
 * p1 = uma1 (Parent 1 from roster - the uma we're evaluating)
 * p2 = Placeholder (Parent 2 - not calculated, assumed to contribute 0)
 * p1.1 = uma1.succession_chara_array[0] (p1's parent 1, becomes p0's grandparent 1)
 * p1.2 = uma1.succession_chara_array[1] (p1's parent 2, becomes p0's grandparent 2)
 *
 * SUCCESSION_CHARA_ARRAY STRUCTURE:
 * ==================================
 * Array indices (not position_id):
 * [0] = uma's first parent (position_id 10, used as GP1)
 * [1] = uma's second parent (position_id 20, used as GP2)
 *
 * AFFINITY FORMULA:
 * ==================
 * p1_aff = aff(p0,p1) + aff(p1,p1.1) + race(p1,p1.1) + aff(p1,p1.2) + race(p1,p1.2)
 *   - aff(p0,p1): Base affinity between target and parent 1
 *   - aff(p1,p1.1) + race(p1,p1.1): p1's relationship with its parent 1
 *   - aff(p1,p1.2) + race(p1,p1.2): p1's relationship with its parent 2
 *   - Note: aff(p1,p2) and race(p1,p2) skipped since p2=0 (placeholder)
 *
 * p1.1_aff = aff(p0,p1,p1.1) + race(p1,p1.1)
 *   - aff(p0,p1,p1.1): 3-way affinity between target, parent, and grandparent
 *   - race(p1,p1.1): Shared races between parent and grandparent
 *   - This contribution is INCLUDED in p1_aff (not added separately to total)
 *
 * p1.2_aff = aff(p0,p1,p1.2) + race(p1,p1.2)
 *   - Same as p1.1_aff but for grandparent 2
 *   - This contribution is INCLUDED in p1_aff (not added separately to total)
 *
 * Total affinity = p1_aff (which already includes all GP contributions)
 *
 * @param targetCharaId - The character to breed (p0), selected from TerumiCharacterData
 * @param uma1 - Roster uma as Parent 1 (p1)
 * @returns Affinity result with p1 total and GP contributions tracked separately
 */
export function calculateSingleParentAffinity(
  targetCharaId: string,
  uma1: CharaData,
): AffinityResult {
  const result: AffinityResult = {
    totalAffinity: 0,
    breakdown: {
      p1: 0, // Parent 1 total: aff(p0,p1) + GP contributions
      p2: 0, // Placeholder - p2 contributes 0
      p1_1: 0, // GP1 contribution (tracked for display): aff(p0,p1,p1.1) + race(p1,p1.1)
      p1_2: 0, // GP2 contribution (tracked for display): aff(p0,p1,p1.2) + race(p1,p1.2)
      p2_1: 0, // Not used (p2 is placeholder)
      p2_2: 0, // Not used (p2 is placeholder)
    },
  };

  // uma1 IS p1 (Parent 1)
  const p1CharaId = getCharaId(uma1.card_id);
  const p1Races = uma1.win_saddle_id_array || [];

  // Extract uma1's parents from succession_chara_array using direct array indices
  // These become p0's grandparents in the breeding lineage
  // Index 0 = parent 1 of uma1 (becomes GP1) - position_id 10
  // Index 1 = parent 2 of uma1 (becomes GP2) - position_id 20
  const p1_1 = uma1.succession_chara_array?.[0];
  const p1_2 = uma1.succession_chara_array?.[1];

  // Calculate p1 direct affinity with target (p0)
  // This is the base affinity between the new uma and parent 1
  result.breakdown.p1 = calculateBaseAffinity([targetCharaId, p1CharaId]);

  // Note: aff(p1,p2) and race(p1,p2) are skipped since p2=0 (placeholder)

  // Calculate grandparent 1 contribution (p1.1)
  // Formula: p1.1_aff = aff(p0,p1,p1.1) + race(p1,p1.1)
  // This uses 3-way affinity to check what p0, p1, and p1.1 all share in common
  // SPECIAL RULE: If GP1 is the same character as p0, base affinity is 0 (but races still count)
  if (p1_1) {
    const p1_1CharaId = getCharaId(p1_1.card_id);
    const p1_1Races = p1_1.win_saddle_id_array || [];

    // Check if grandparent is the same character as target (p0)
    // If so, base affinity should be 0, but race affinity still counts
    let gp1Affinity = 0;
    if (p1_1CharaId !== targetCharaId) {
      // 3-way affinity between target (p0), parent (p1), and grandparent (p1.1)
      gp1Affinity = calculateBaseAffinity([
        targetCharaId,
        p1CharaId,
        p1_1CharaId,
      ]);
    }
    const gp1Races = calculateSharedRaces(p1Races, p1_1Races);

    // Track GP1 contribution separately for UI display
    result.breakdown.p1_1 = gp1Affinity + gp1Races;

    // Add to P1's total (GP contributions are part of parent's affinity)
    result.breakdown.p1 += gp1Affinity + gp1Races;
  }

  // Calculate grandparent 2 contribution (p1.2)
  // Formula: p1.2_aff = aff(p0,p1,p1.2) + race(p1,p1.2)
  // This uses 3-way affinity to check what p0, p1, and p1.2 all share in common
  // SPECIAL RULE: If GP2 is the same character as p0, base affinity is 0 (but races still count)
  if (p1_2) {
    const p1_2CharaId = getCharaId(p1_2.card_id);
    const p1_2Races = p1_2.win_saddle_id_array || [];

    // Check if grandparent is the same character as target (p0)
    // If so, base affinity should be 0, but race affinity still counts
    let gp2Affinity = 0;
    if (p1_2CharaId !== targetCharaId) {
      // 3-way affinity between target (p0), parent (p1), and grandparent (p1.2)
      gp2Affinity = calculateBaseAffinity([
        targetCharaId,
        p1CharaId,
        p1_2CharaId,
      ]);
    }
    const gp2Races = calculateSharedRaces(p1Races, p1_2Races);

    // Track GP2 contribution separately for UI display
    result.breakdown.p1_2 = gp2Affinity + gp2Races;

    // Add to P1's total (GP contributions are part of parent's affinity)
    result.breakdown.p1 += gp2Affinity + gp2Races;
  }

  // Total affinity = P1's total contribution (which includes GP contributions)
  result.totalAffinity = result.breakdown.p1;

  return result;
}

/**
 * Type extensions for CharaData to include win_saddle_id_array
 */
declare module "./types" {
  interface CharaData {
    win_saddle_id_array?: number[];
  }
  interface SuccessionCharaData {
    win_saddle_id_array?: number[];
  }
}
