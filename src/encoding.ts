/**
 * URL Encoding/Decoding for Uma Musume Roster Viewer
 *
 * Inspired by Wynnbuilder's encoding system.
 * Uses a compact binary format converted to Base64 for URL sharing.
 *
 * ENCODING SPEC V4:
 *
 *
 * Header (8 bits):
 *   - Version: 8 bits (0-255)
 *
 * Per Character:
 *   - card_id: 20 bits (supports up to 1M)
 *   - talent_level: 3 bits (1-5 stored as 0-4)
 *   - rank_score flag: 1 bit (0 = no rank_score, 1 = has rank_score)
 *   - rank_score: 15 bits if flag is 1 (0-32767)
 *   - Stats (5 x 11 bits = 55 bits): speed, stamina, power, guts, wiz (0-2047)
 *   - Aptitudes (10 x 3 bits = 30 bits): each 1-8 mapped to 0-7
 *   - Factor count: 4 bits (0-15)
 *   - Factors: count x 24 bits (factor_id, supports up to 16M)
 *   - Skill count: 6 bits (0-63)
 *   - Skills: count x 21 bits (20 for skill_id + 1 for level>1 flag)
 *   - Parent count: 2 bits (0-3)
 *   - Per Parent:
 *     - card_id: 20 bits
 *     - talent_level: 3 bits
 *     - Factor count: 4 bits
 *     - Factors: count x 24 bits
 *
 * COMPRESSION:
 *
 * URLs are automatically compressed using gzip (CompressionStream API).
 * Provides 60-70% size reduction on typical character data.
 *
 * Format detection:
 *   - URLs starting with 'z': Compressed format (gzip + Base64)
 *   - URLs without 'z' prefix: Uncompressed format (raw Base64)
 *
 * Compression is only applied if it actually reduces the size.
 * Falls back gracefully for browsers without CompressionStream support.
 *
 * Examples:
 *   - 5 characters:  1,102 → ~400 chars (64% smaller)
 *   - 10 characters: 2,202 → ~800 chars (64% smaller)
 *   - 20 characters: 4,402 → ~1,600 chars (64% smaller)
 *
 */

const ENCODING_VERSION = 4;

// Custom Base64 alphabet (URL-safe)
const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

// Check if CompressionStream is available (modern browsers)
const supportsCompression =
  typeof CompressionStream !== "undefined" &&
  typeof DecompressionStream !== "undefined";

// Log compression support on initialization
if (typeof window !== "undefined") {
  console.log(
    `[Encoding] Compression support: ${supportsCompression ? "✓ Available" : "✗ Not available"}`,
  );
  if (!supportsCompression) {
    console.log(
      "[Encoding] CompressionStream:",
      typeof CompressionStream !== "undefined",
    );
    console.log(
      "[Encoding] DecompressionStream:",
      typeof DecompressionStream !== "undefined",
    );
  }
}

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

  /** Read a signed value (2's complement) */
  readSigned(bitLength: number): number {
    const value = this.read(bitLength);
    const signBit = 1 << (bitLength - 1);
    if (value & signBit) {
      return value - (1 << bitLength);
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
import type { CharaData, SkillData, SuccessionCharaData } from "./types";

/**
 * Compression helpers
 */

/**
 * Convert URL-safe Base64 to standard Base64
 */
function urlSafeToStandard(urlSafe: string): string {
  return urlSafe.replace(/-/g, "+").replace(/_/g, "/");
}

/**
 * Convert standard Base64 to URL-safe Base64
 */
function standardToUrlSafe(standard: string): string {
  return standard.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Convert Base64 to Uint8Array (handles URL-safe Base64)
 */
function base64ToBytes(base64: string): Uint8Array {
  // Convert URL-safe to standard Base64 for atob()
  const standard = urlSafeToStandard(base64);
  const binaryString = atob(standard);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to Base64 (returns URL-safe Base64)
 */
function bytesToBase64(bytes: Uint8Array): string {
  const binaryString = Array.from(bytes)
    .map((byte) => String.fromCharCode(byte))
    .join("");
  const standard = btoa(binaryString);
  // Convert to URL-safe Base64
  return standardToUrlSafe(standard);
}

/**
 * Compress data using gzip
 */
async function compressData(data: Uint8Array): Promise<Uint8Array> {
  if (!supportsCompression) {
    return data; // Fallback: return uncompressed
  }

  const stream = new Blob([data])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));

  const compressed = await new Response(stream).arrayBuffer();
  return new Uint8Array(compressed);
}

/**
 * Decompress gzip data
 */
async function decompressData(data: Uint8Array): Promise<Uint8Array> {
  if (!supportsCompression) {
    return data; // Fallback: return as-is
  }

  const stream = new Blob([data])
    .stream()
    .pipeThrough(new DecompressionStream("gzip"));

  const decompressed = await new Response(stream).arrayBuffer();
  return new Uint8Array(decompressed);
}

/**
 * Encode a single character to BitVector (V4)
 */
function encodeChara(bv: BitVector, chara: CharaData): void {
  // card_id: 20 bits
  bv.write(chara.card_id, 20);

  // talent_level: 3 bits (1-5 stored as 0-4)
  bv.write(chara.talent_level - 1, 3);

  // rank_score: 1 bit flag + 15 bits if present
  if (chara.rank_score !== undefined) {
    bv.write(1, 1); // Flag: has rank_score
    bv.write(Math.min(chara.rank_score, 32767), 15);
  } else {
    bv.write(0, 1); // Flag: no rank_score
  }

  // Stats: 5 x 11 bits (0-2047)
  bv.write(Math.min(chara.speed, 2047), 11);
  bv.write(Math.min(chara.stamina, 2047), 11);
  bv.write(Math.min(chara.power, 2047), 11);
  bv.write(Math.min(chara.guts, 2047), 11);
  bv.write(Math.min(chara.wiz, 2047), 11);

  // Aptitudes: 10 x 3 bits (1-8 stored as 0-7)
  bv.write(chara.proper_distance_short - 1, 3);
  bv.write(chara.proper_distance_mile - 1, 3);
  bv.write(chara.proper_distance_middle - 1, 3);
  bv.write(chara.proper_distance_long - 1, 3);
  bv.write(chara.proper_ground_turf - 1, 3);
  bv.write(chara.proper_ground_dirt - 1, 3);
  bv.write(chara.proper_running_style_nige - 1, 3);
  bv.write(chara.proper_running_style_senko - 1, 3);
  bv.write(chara.proper_running_style_sashi - 1, 3);
  bv.write(chara.proper_running_style_oikomi - 1, 3);

  // Factors: 4-bit count + 24-bit IDs
  const factors = chara.factor_id_array.slice(0, 15); // Max 15
  bv.write(factors.length, 4);
  for (const factorId of factors) {
    bv.write(factorId, 24);
  }

  // Skills: 6-bit count + 21-bit entries (20 id + 1 level flag)
  const skills = chara.skill_array.slice(0, 63); // Max 63
  bv.write(skills.length, 6);
  for (const skill of skills) {
    bv.write(skill.skill_id, 20); // FIXED: was 16, now 20 bits
    bv.write(skill.level > 1 ? 1 : 0, 1); // Same as V2: just store if level > 1
  }

  // Parents: 2-bit count
  const parents = chara.succession_chara_array.slice(0, 3); // Max 3
  bv.write(parents.length, 2);
  for (const parent of parents) {
    bv.write(parent.card_id, 20);
    bv.write(parent.talent_level - 1, 3);
    const parentFactors = parent.factor_id_array.slice(0, 15);
    bv.write(parentFactors.length, 4);
    for (const factorId of parentFactors) {
      bv.write(factorId, 24);
    }
  }
}

/**
 * Decode a single character from BitVector (V4)
 */
function decodeChara(bv: BitVector): CharaData | null {
  if (bv.remaining() < 109) return null; // Minimum bits needed (108 + 1 for rank_score flag)

  const card_id = bv.read(20); // 20 bits
  const talent_level = bv.read(3) + 1;

  // rank_score: 1 bit flag + 15 bits if present
  const hasRankScore = bv.read(1);
  const rank_score = hasRankScore ? bv.read(15) : undefined;

  const speed = bv.read(11);
  const stamina = bv.read(11);
  const power = bv.read(11);
  const guts = bv.read(11); // 11 bits
  const wiz = bv.read(11);

  const proper_distance_short = bv.read(3) + 1;
  const proper_distance_mile = bv.read(3) + 1;
  const proper_distance_middle = bv.read(3) + 1;
  const proper_distance_long = bv.read(3) + 1;
  const proper_ground_turf = bv.read(3) + 1;
  const proper_ground_dirt = bv.read(3) + 1;
  const proper_running_style_nige = bv.read(3) + 1;
  const proper_running_style_senko = bv.read(3) + 1;
  const proper_running_style_sashi = bv.read(3) + 1;
  const proper_running_style_oikomi = bv.read(3) + 1;

  // Factors
  const factorCount = bv.read(4);
  const factor_id_array: number[] = [];
  for (let i = 0; i < factorCount; i++) {
    factor_id_array.push(bv.read(24));
  }

  // Skills
  const skillCount = bv.read(6);
  const skill_array: SkillData[] = [];
  for (let i = 0; i < skillCount; i++) {
    const skill_id = bv.read(20); // FIXED: was 16, now 20 bits
    const levelFlag = bv.read(1); // Same as V2: just level > 1 flag
    skill_array.push({ skill_id, level: levelFlag ? 2 : 1 });
  }

  // Parents
  const parentCount = bv.read(2);
  const succession_chara_array: SuccessionCharaData[] = [];
  for (let i = 0; i < parentCount; i++) {
    const parent_card_id = bv.read(20);
    const parent_talent_level = bv.read(3) + 1;
    const parentFactorCount = bv.read(4);
    const parent_factor_id_array: number[] = [];
    for (let j = 0; j < parentFactorCount; j++) {
      parent_factor_id_array.push(bv.read(24));
    }
    succession_chara_array.push({
      card_id: parent_card_id,
      talent_level: parent_talent_level,
      factor_id_array: parent_factor_id_array,
      position_id: i + 1,
    });
  }

  return {
    card_id,
    talent_level,
    create_time: new Date().toISOString().replace("T", " ").slice(0, 19),
    rarity: 3, // Default
    chara_seed: Math.floor(Math.random() * 1000000),
    rank_score,
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
    factor_id_array,
    skill_array,
    succession_chara_array,
    support_card_list: [],
  };
}

/**
 * Encode multiple characters to a URL-safe string (with optional gzip)
 */
export async function encodeCharas(
  charas: CharaData[],
  compress: boolean = true,
): Promise<string> {
  const bv = new BitVector();

  // Version header (8 bits only)
  bv.write(ENCODING_VERSION, 8);

  // Encode each character (no count needed, decoder reads until end)
  for (const chara of charas) {
    encodeChara(bv, chara);
  }

  const base64 = bv.toBase64();

  // Compress if requested and supported
  if (compress && supportsCompression) {
    try {
      console.log(
        `Attempting compression: ${base64.length} chars, ${charas.length} characters`,
      );
      const bytes = base64ToBytes(base64);
      const compressed = await compressData(bytes);
      const compressedBase64 = bytesToBase64(compressed);

      console.log(
        `Compression result: ${base64.length} → ${compressedBase64.length} chars (${Math.round((1 - compressedBase64.length / base64.length) * 100)}% savings)`,
      );

      // Only use compression if it actually makes things smaller
      if (compressedBase64.length < base64.length) {
        console.log("✓ Using compressed format");
        return "z" + compressedBase64; // 'z' prefix = compressed
      } else {
        console.log("✗ Compressed is larger, using uncompressed");
      }
    } catch (err) {
      console.warn("Compression failed, using uncompressed:", err);
    }
  } else {
    if (!compress) {
      console.log("Compression disabled by parameter");
    }
    if (!supportsCompression) {
      console.log(
        "CompressionStream not supported in this browser, using uncompressed",
      );
    }
  }

  return base64; // Uncompressed
}

/**
 * Decode characters from a URL-safe string (handles compressed and uncompressed)
 */
export async function decodeCharas(encoded: string): Promise<CharaData[]> {
  try {
    console.log("decodeCharas input length:", encoded.length);

    let base64 = encoded;
    const isCompressed = encoded.startsWith("z");

    // Handle compression
    if (isCompressed) {
      console.log("Detected compressed format");
      const compressedBase64 = encoded.slice(1); // Remove 'z' prefix
      const compressedBytes = base64ToBytes(compressedBase64);
      const decompressedBytes = await decompressData(compressedBytes);
      base64 = bytesToBase64(decompressedBytes);
      console.log(
        "Decompressed:",
        compressedBase64.length,
        "→",
        base64.length,
        "chars",
      );
    }

    const bv = BitVector.fromBase64(base64);
    console.log("BitVector total bits:", bv.remaining());

    const version = bv.read(8);
    console.log("Decoded version:", version);

    if (version !== ENCODING_VERSION) {
      console.error(
        `Unsupported encoding version: expected ${ENCODING_VERSION}, got ${version}`,
      );
      return [];
    }

    const charas: CharaData[] = [];
    let index = 0;

    // Keep decoding until we run out of bits
    while (bv.remaining() >= 109) {
      console.log(
        `Decoding character ${index + 1}, remaining bits:`,
        bv.remaining(),
      );
      const chara = decodeChara(bv);
      if (chara) {
        console.log(
          `Character ${index + 1} decoded: card_id=${chara.card_id}, speed=${chara.speed}, skills=${chara.skill_array.length}`,
        );
        charas.push(chara);
        index++;
      } else {
        console.log(`Character ${index + 1} failed to decode`);
        break;
      }
    }

    console.log("Total decoded characters:", charas.length);
    return charas;
  } catch (error) {
    console.error("Failed to decode characters:", error);
    return [];
  }
}

/**
 * Get/set the encoded data in URL hash
 */
export function getEncodedFromUrl(): string | null {
  const hash = window.location.hash.slice(1); // Remove #
  return hash || null;
}

export function setEncodedToUrl(encoded: string): void {
  window.history.replaceState(null, "", `#${encoded}`);
}

export function clearUrlEncoding(): void {
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
}

/**
 * Copy encoded string to clipboard (with compression)
 */
export async function copyEncodedToClipboard(
  charas: CharaData[],
  compress: boolean = true,
): Promise<boolean> {
  try {
    const encoded = await encodeCharas(charas, compress);
    const url = `${window.location.origin}${window.location.pathname}#${encoded}`;
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Export compression support flag
 */
export { supportsCompression };

/**
 * Calculate approximate URL length for given characters
 */
export function estimateEncodedLength(charas: CharaData[]): number {
  // Rough estimate: header + per-chara overhead
  // Each character is roughly 1200-1400 bits depending on factors/skills/parents
  const avgBitsPerChara = 1320;
  const headerBits = 8;
  const totalBits = headerBits + charas.length * avgBitsPerChara;
  return Math.ceil(totalBits / 6); // Base64 chars
}
