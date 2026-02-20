/**
 * Single Uma Export Encoding
 *
 * Simplified encoding for exporting individual uma data.
 * Based on the standard encoding.ts but only includes essential fields:
 * - card_id
 * - Stats (speed, stamina, power, guts, wiz)
 * - Aptitudes (distance, ground, running style)
 * - create_time (Unix timestamp)
 * - rank_score (optional)
 * - Skills with levels
 *
 * ENCODING SPEC V2:
 *
 * Header (8 bits):
 *   - Version: 8 bits (0-255)
 *
 * Single Character:
 *   - card_id: 20 bits (supports up to 1M)
 *   - Stats (5 x 11 bits = 55 bits): speed, stamina, power, guts, wiz (0-2047)
 *   - Aptitudes (10 x 4 bits = 40 bits): each 0-9
 *   - create_time: 32 bits (Unix timestamp in seconds)
 *   - rank_score flag: 1 bit (0 = no rank_score, 1 = has rank_score)
 *   - rank_score: 15 bits if flag is 1 (0-32767)
 *   - Skill count: 6 bits (0-63)
 *   - Skills: count x 24 bits (20 for skill_id + 4 for level 1-16)
 */

const SINGLE_EXPORT_VERSION = 2;

// Custom Base64 alphabet (URL-safe)
const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * BitVector class for efficient binary encoding/decoding
 */
class BitVector {
  private bits: number[] = [];
  private readPos = 0;

  /** Write a value with specified bit length */
  write(value: number, bitLength: number): void {
    for (let i = bitLength - 1; i >= 0; i--) {
      this.bits.push((value >> i) & 1);
    }
  }

  /** Read a value with specified bit length */
  read(bitLength: number): number {
    let value = 0;
    for (let i = 0; i < bitLength; i++) {
      value = (value << 1) | (this.bits[this.readPos++] ?? 0);
    }
    return value;
  }

  /** Get remaining bits to read */
  remaining(): number {
    return this.bits.length - this.readPos;
  }

  /** Pad to multiple of 6 for Base64 */
  padToBase64(): void {
    while (this.bits.length % 6 !== 0) {
      this.bits.push(0);
    }
  }

  /** Convert to Base64 string */
  toBase64(): string {
    this.padToBase64();
    let result = "";
    for (let i = 0; i < this.bits.length; i += 6) {
      let value = 0;
      for (let j = 0; j < 6; j++) {
        value = (value << 1) | (this.bits[i + j] ?? 0);
      }
      result += BASE64_CHARS[value];
    }
    return result;
  }

  /** Load from Base64 string */
  static fromBase64(str: string): BitVector {
    const bv = new BitVector();
    for (const char of str) {
      const value = BASE64_CHARS.indexOf(char);
      if (value === -1) continue; // Skip invalid chars
      for (let i = 5; i >= 0; i--) {
        bv.bits.push((value >> i) & 1);
      }
    }
    return bv;
  }

  /** Get current length */
  get length(): number {
    return this.bits.length;
  }
}

// Type imports
import type { CharaData, SkillData } from "../types";

/**
 * Simplified uma data for single export
 */
export interface SingleExportData {
  card_id: number;
  speed: number;
  stamina: number;
  power: number;
  guts: number;
  wiz: number;
  proper_distance_short: number;
  proper_distance_mile: number;
  proper_distance_middle: number;
  proper_distance_long: number;
  proper_ground_turf: number;
  proper_ground_dirt: number;
  proper_running_style_nige: number;
  proper_running_style_senko: number;
  proper_running_style_sashi: number;
  proper_running_style_oikomi: number;
  create_time: string;
  rank_score?: number;
  skill_array: SkillData[];
}

/**
 * Encode a single uma to Base64 string
 */
export function encodeSingleUma(data: SingleExportData): string {
  const bv = new BitVector();

  // Version header (8 bits)
  bv.write(SINGLE_EXPORT_VERSION, 8);

  // card_id: 20 bits
  bv.write(data.card_id, 20);

  // Stats: 5 x 11 bits (0-2047)
  bv.write(Math.min(data.speed, 2047), 11);
  bv.write(Math.min(data.stamina, 2047), 11);
  bv.write(Math.min(data.power, 2047), 11);
  bv.write(Math.min(data.guts, 2047), 11);
  bv.write(Math.min(data.wiz, 2047), 11);

  // Aptitudes: 10 x 4 bits (0-9)
  bv.write(Math.min(data.proper_distance_short, 9), 4);
  bv.write(Math.min(data.proper_distance_mile, 9), 4);
  bv.write(Math.min(data.proper_distance_middle, 9), 4);
  bv.write(Math.min(data.proper_distance_long, 9), 4);
  bv.write(Math.min(data.proper_ground_turf, 9), 4);
  bv.write(Math.min(data.proper_ground_dirt, 9), 4);
  bv.write(Math.min(data.proper_running_style_nige, 9), 4);
  bv.write(Math.min(data.proper_running_style_senko, 9), 4);
  bv.write(Math.min(data.proper_running_style_sashi, 9), 4);
  bv.write(Math.min(data.proper_running_style_oikomi, 9), 4);

  // create_time: 32-bit Unix timestamp in seconds
  const createTimestamp = Math.floor(
    new Date(data.create_time.replace(" ", "T")).getTime() / 1000,
  );
  bv.write(createTimestamp >>> 0, 32); // >>> 0 keeps it unsigned 32-bit

  // rank_score: 1-bit flag + 15 bits if present
  if (data.rank_score !== undefined) {
    bv.write(1, 1);
    bv.write(Math.min(data.rank_score, 32767), 15);
  } else {
    bv.write(0, 1);
  }

  // Skills: 6-bit count + 24-bit entries (20 for skill_id + 4 for level)
  const skills = data.skill_array.slice(0, 63); // Max 63
  bv.write(skills.length, 6);
  for (const skill of skills) {
    bv.write(skill.skill_id, 20);
    bv.write(Math.min(skill.level - 1, 15), 4); // Level 1-16 stored as 0-15
  }

  return bv.toBase64();
}

/**
 * Decode a single uma from Base64 string
 */
export function decodeSingleUma(encoded: string): SingleExportData | null {
  try {
    const bv = BitVector.fromBase64(encoded);

    // Check minimum bits (version + card_id + stats + aptitudes + create_time + rank_score_flag + skill_count = 8 + 20 + 55 + 40 + 32 + 1 + 6 = 162)
    if (bv.remaining() < 162) {
      console.error("Insufficient bits for single uma decode");
      return null;
    }

    // Version
    const version = bv.read(8);
    if (version !== SINGLE_EXPORT_VERSION) {
      console.error(
        `Unsupported single export version: expected ${SINGLE_EXPORT_VERSION}, got ${version}`,
      );
      return null;
    }

    // card_id
    const card_id = bv.read(20);

    // Stats
    const speed = bv.read(11);
    const stamina = bv.read(11);
    const power = bv.read(11);
    const guts = bv.read(11);
    const wiz = bv.read(11);

    // Aptitudes
    const proper_distance_short = bv.read(4);
    const proper_distance_mile = bv.read(4);
    const proper_distance_middle = bv.read(4);
    const proper_distance_long = bv.read(4);
    const proper_ground_turf = bv.read(4);
    const proper_ground_dirt = bv.read(4);
    const proper_running_style_nige = bv.read(4);
    const proper_running_style_senko = bv.read(4);
    const proper_running_style_sashi = bv.read(4);
    const proper_running_style_oikomi = bv.read(4);

    // create_time: 32-bit Unix timestamp in seconds
    const createTimestamp = bv.read(32);
    const createDate = new Date(createTimestamp * 1000);
    const create_time = createDate.toISOString().replace("T", " ").slice(0, 19);

    // rank_score: 1-bit flag + 15 bits if present
    const hasRankScore = bv.read(1) === 1;
    const rank_score = hasRankScore ? bv.read(15) : undefined;

    // Skills
    const skillCount = bv.read(6);
    const skill_array: SkillData[] = [];
    for (let i = 0; i < skillCount; i++) {
      if (bv.remaining() < 24) break; // Not enough bits for skill
      const skill_id = bv.read(20);
      const level = bv.read(4) + 1; // 0-15 stored, +1 for actual level
      skill_array.push({ skill_id, level });
    }

    return {
      card_id,
      speed,
      stamina,
      power,
      guts,
      wiz,
      proper_distance_short,
      proper_distance_mile,
      proper_distance_middle,
      proper_distance_long,
      proper_ground_turf,
      proper_ground_dirt,
      proper_running_style_nige,
      proper_running_style_senko,
      proper_running_style_sashi,
      proper_running_style_oikomi,
      create_time,
      rank_score,
      skill_array,
    };
  } catch (error) {
    console.error("Failed to decode single uma:", error);
    return null;
  }
}

/**
 * Convert CharaData to SingleExportData
 */
export function charaToSingleExport(chara: CharaData): SingleExportData {
  return {
    card_id: chara.card_id,
    speed: chara.speed,
    stamina: chara.stamina,
    power: chara.power,
    guts: chara.guts,
    wiz: chara.wiz,
    proper_distance_short: chara.proper_distance_short,
    proper_distance_mile: chara.proper_distance_mile,
    proper_distance_middle: chara.proper_distance_middle,
    proper_distance_long: chara.proper_distance_long,
    proper_ground_turf: chara.proper_ground_turf,
    proper_ground_dirt: chara.proper_ground_dirt,
    proper_running_style_nige: chara.proper_running_style_nige,
    proper_running_style_senko: chara.proper_running_style_senko,
    proper_running_style_sashi: chara.proper_running_style_sashi,
    proper_running_style_oikomi: chara.proper_running_style_oikomi,
    create_time: chara.create_time,
    rank_score: chara.rank_score,
    skill_array: chara.skill_array,
  };
}

/**
 * Convert SingleExportData to partial CharaData (for import)
 */
export function singleExportToChara(
  data: SingleExportData,
): Partial<CharaData> {
  return {
    card_id: data.card_id,
    speed: data.speed,
    stamina: data.stamina,
    power: data.power,
    guts: data.guts,
    wiz: data.wiz,
    proper_distance_short: data.proper_distance_short,
    proper_distance_mile: data.proper_distance_mile,
    proper_distance_middle: data.proper_distance_middle,
    proper_distance_long: data.proper_distance_long,
    proper_ground_turf: data.proper_ground_turf,
    proper_ground_dirt: data.proper_ground_dirt,
    proper_running_style_nige: data.proper_running_style_nige,
    proper_running_style_senko: data.proper_running_style_senko,
    proper_running_style_sashi: data.proper_running_style_sashi,
    proper_running_style_oikomi: data.proper_running_style_oikomi,
    create_time: data.create_time,
    rank_score: data.rank_score,
    skill_array: data.skill_array,
  };
}
