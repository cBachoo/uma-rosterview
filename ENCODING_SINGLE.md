# Single Uma Export Encoding

This document describes the encoding format used for exporting individual uma data in the Uma Musume Roster Viewer.

## Overview

The single uma export format is a simplified, compact encoding designed for sharing individual character data. It includes only the essential information needed to represent an uma's trained state: stats, aptitudes, creation date, rank score, and skills.

The encoding uses a binary vector format converted to URL-safe Base64, making it suitable for copying/pasting or embedding in URLs.

## What's Included

The single export format includes:
- **Card ID**: Character card identifier
- **Base Statistics**: Speed, Stamina, Power, Guts, Wisdom
- **Aptitudes**: Distance (Short/Mile/Middle/Long), Ground (Turf/Dirt), Running Style (Nige/Senko/Sashi/Oikomi)
- **Creation Date**: When the uma was trained (Unix timestamp, second precision)
- **Rank Score**: Competitive rank score, if present (optional)
- **Skills**: All learned skills with their levels (1-16)

## What's NOT Included

The following fields are excluded to keep the encoding compact:
- Talent level
- Rarity
- Character seed
- Factors (sparks)
- Parent information
- Support cards
- Win saddle IDs

## Encoding Specification - Version 2

### Notation

- **Lengths in bits** are fixed values determined by the maximum possible values
- **Values are unsigned integers** unless otherwise specified
- **Base64** uses URL-safe alphabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`

### Binary Format

#### 1. Header (8 bits)

| Field   | Length (bits) | Type    | Range     |
|---------|---------------|---------|-----------|
| Version | 8             | `uint8` | [0, 255]  |

The version field identifies the encoding format. Current version is **2**.

#### 2. Character Data

##### 2.1 Basic Information

| Field   | Length (bits) | Type     | Range         |
|---------|---------------|----------|---------------|
| card_id | 20            | `uint32` | [0, 1048575]  |

The `card_id` identifies the character card (e.g., 100601 for Special Week).

##### 2.2 Statistics (55 bits total)

| Field   | Length (bits) | Type     | Range      |
|---------|---------------|----------|------------|
| speed   | 11            | `uint16` | [0, 2047]  |
| stamina | 11            | `uint16` | [0, 2047]  |
| power   | 11            | `uint16` | [0, 2047]  |
| guts    | 11            | `uint16` | [0, 2047]  |
| wiz     | 11            | `uint16` | [0, 2047]  |

All statistics are 11 bits each, supporting values from 0 to 2047. Values are clamped to this range during encoding.

##### 2.3 Aptitudes (40 bits total)

| Field                        | Length (bits) | Type    | Range   |
|------------------------------|---------------|---------|---------|
| proper_distance_short        | 4             | `uint8` | [0, 9]  |
| proper_distance_mile         | 4             | `uint8` | [0, 9]  |
| proper_distance_middle       | 4             | `uint8` | [0, 9]  |
| proper_distance_long         | 4             | `uint8` | [0, 9]  |
| proper_ground_turf           | 4             | `uint8` | [0, 9]  |
| proper_ground_dirt           | 4             | `uint8` | [0, 9]  |
| proper_running_style_nige    | 4             | `uint8` | [0, 9]  |
| proper_running_style_senko   | 4             | `uint8` | [0, 9]  |
| proper_running_style_sashi   | 4             | `uint8` | [0, 9]  |
| proper_running_style_oikomi  | 4             | `uint8` | [0, 9]  |

Aptitudes range from 0-9 in the game. They are stored directly without adjustment. Values are clamped to 9 if they exceed this range during encoding.

**Aptitude Grades:**
- 0 → erm...
- 1 → G
- 2 → F
- 3 → E
- 4 → D
- 5 → C
- 6 → B
- 7 → A
- 8 → S
- 9 → :buh:

##### 2.4 Creation Date (32 bits)

| Field       | Length (bits) | Type     | Range                      |
|-------------|---------------|----------|----------------------------|
| create_time | 32            | `uint32` | [0, 4294967295]            |

Stored as a Unix timestamp in seconds (seconds since 1970-01-01 00:00:00 UTC). Supports dates up to the year 2106.

- **Encoding**: The `"YYYY-MM-DD HH:MM:SS"` string is parsed as UTC, divided by 1000, floored, and written as an unsigned 32-bit integer (`>>> 0`).
- **Decoding**: The integer is multiplied by 1000 to get milliseconds, converted to a `Date`, and formatted back as `"YYYY-MM-DD HH:MM:SS"` (UTC).

##### 2.5 Rank Score (1 or 16 bits)

| Field            | Length (bits) | Type    | Notes                          |
|------------------|---------------|---------|--------------------------------|
| rank_score_flag  | 1             | `uint1` | `0` = absent, `1` = present   |
| rank_score       | 15            | `uint16`| Only written if flag is `1`    |

The rank score is optional. When absent only the single flag bit is written (saving 15 bits). When present, the flag is `1` followed by the 15-bit value, supporting scores from 0 to 32767.

##### 2.6 Skills (Variable length)

| Field       | Length (bits)   | Type     | Range         |
|-------------|-----------------|----------|---------------|
| skill_count | 6               | `uint8`  | [0, 63]       |
| skill_id    | 20 (per skill)  | `uint32` | [0, 1048575]  |
| skill_level | 4 (per skill)   | `uint8`  | [0, 15]       |

The `skill_count` field indicates how many skills the character has learned. **Maximum supported: 63 skills** (same as full roster encoding).

Each skill consists of:
- **skill_id**: 20 bits (supports IDs up to 1,048,575)
- **skill_level**: 4 bits (supports levels 0-15, representing actual levels 1-16)
  - Stored as `level - 1`
  - Game currently uses levels 1-8, but the encoding supports up to level 16 for future expansion

Total bits per skill: **24 bits** (20 + 4)

### Base64 Encoding

After encoding all fields into the bit vector, the vector is padded to a multiple of 6 bits (to align with Base64 encoding), then converted to URL-safe Base64.

The URL-safe Base64 alphabet is:
```
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_
```

This differs from standard Base64 which uses `+` and `/`. The URL-safe variant uses `-` and `_` instead, and omits padding characters (`=`).

## Size Analysis

### Bit Breakdown

Minimum bits (no rank_score, no skills):
```
Version:           8 bits
card_id:          20 bits
Stats:            55 bits (11 × 5)
Aptitudes:        40 bits (4 × 10)
create_time:      32 bits
rank_score_flag:   1 bit
skill_count:       6 bits
Total:           162 bits minimum
                = 27 Base64 characters
```

With rank_score:
```
Base:            162 bits
rank_score:      +15 bits
Total:           177 bits
                = 30 Base64 characters
```

With skills:
```
Base:            162 bits  (or 177 with rank_score)
Per skill:        24 bits
Total:           162 + (24 × skill_count) bits
```

### Examples

**Character with 10 skills (no rank score):**
```
162 + (24 × 10) = 402 bits
                = 67 Base64 characters
```

**Character with 10 skills (with rank score):**
```
177 + (24 × 10) = 417 bits
                = 70 Base64 characters
```

**Character with 30 skills:**
```
162 + (24 × 30) = 882 bits
                = 147 Base64 characters
```

**Character with 63 skills (maximum):**
```
162 + (24 × 63) = 1,674 bits
                 = 279 Base64 characters
```

### Typical Size Range

| Skill Count | Approximate Length |
|-------------|-------------------|
| 0-10        | 55-90 chars       |
| 10-20       | 90-130 chars      |
| 20-30       | 130-170 chars     |
| 30-50       | 170-250 chars     |
| 50-63       | 250-285 chars     |

Most trained uma have 8-20 skills, resulting in codes of **67-140 characters** - very compact and easy to copy/paste.

## Encoding Process

1. Create a BitVector instance
2. Write version header (8 bits, value = 2)
3. Write card_id (20 bits)
4. Write stats in order: speed, stamina, power, guts, wiz (11 bits each, clamped to 2047)
5. Write aptitudes in order: distances, grounds, styles (4 bits each, clamped to 9)
6. Write create_time as Unix timestamp in seconds (32 bits, unsigned)
7. Write rank_score flag (1 bit); if `1`, write rank_score (15 bits, clamped to 32767)
8. Write skill_count (6 bits, max 63)
9. For each skill:
   - Write skill_id (20 bits)
   - Write level - 1 (4 bits)
10. Pad bit vector to multiple of 6
11. Convert to URL-safe Base64

## Decoding Process

1. Convert Base64 string to BitVector
2. Check minimum bits (162)
3. Read version (8 bits), verify it's 2
4. Read card_id (20 bits)
5. Read stats (5 × 11 bits each)
6. Read aptitudes (10 × 4 bits each)
7. Read create_time (32 bits); convert to `"YYYY-MM-DD HH:MM:SS"` string
8. Read rank_score_flag (1 bit); if `1`, read rank_score (15 bits)
9. Read skill_count (6 bits)
10. For each skill:
    - Read skill_id (20 bits)
    - Read level (4 bits), add 1 for actual level
11. Return SingleExportData object

## Error Handling

### Encoding Errors
- Stats are clamped to 0-2047 if they exceed the range
- Rank score is clamped to 0-32767 if it exceeds the range
- Skill levels are clamped to 0-15 (representing 1-16)
- Only the first 63 skills are encoded if more are present

### Decoding Errors
- Returns `null` if insufficient bits for minimum character data
- Returns `null` if version doesn't match (expected: 2)
- Logs errors to console for debugging
- Stops reading skills if insufficient bits remain

## Comparison with Full Roster Encoding

| Feature              | Single Export | Full Roster |
|----------------------|---------------|-------------|
| Version              | 2             | 4           |
| Per Character        | 67-285 chars  | 200-250 chars |
| Factors              | ❌            | ✅          |
| Parents              | ❌            | ✅          |
| Rank Score           | ✅            | ✅          |
| Create Time          | ✅            | ❌          |
| Talent Level         | ❌            | ✅          |
| Compression          | ❌            | ✅ (gzip)   |
| Multiple Characters  | ❌            | ✅          |
| Skills (level range) | 1-16          | 1-2+        |
| Max Skills           | 63            | 63          |

**Use single export when:**
- Sharing individual uma stats and skills
- Importing uma into tools that only need stats/skills
- Creating compact codes for social media/chat

**Use full roster encoding when:**
- Sharing complete roster data
- Preserving all character information including factors and parents
- Sharing multiple characters at once

## Implementation Notes

### BitVector Class

The BitVector class manages the binary encoding:
- `write(value, bitLength)`: Writes a value using specified number of bits
- `read(bitLength)`: Reads a value using specified number of bits
- `toBase64()`: Converts bit vector to URL-safe Base64 string
- `fromBase64(str)`: Creates bit vector from URL-safe Base64 string

Bits are written and read in big-endian order (most significant bit first).

### Helper Functions

**For Encoding:**
- `encodeSingleUma(data: SingleExportData): string`
  - Main encoding function
  - Returns URL-safe Base64 string

- `charaToSingleExport(chara: CharaData): SingleExportData`
  - Converts full CharaData to simplified export format
  - Extracts only the fields needed for single export

**For Decoding:**
- `decodeSingleUma(encoded: string): SingleExportData | null`
  - Main decoding function
  - Returns decoded data or null on error

- `singleExportToChara(data: SingleExportData): Partial<CharaData>`
  - Converts export data to partial CharaData format
  - Useful for displaying imported data

## Future Extensibility

To support new encoding versions:
1. Increment version number in header
2. Add new encode/decode functions for the new format
3. Update version check in decoder to handle multiple versions
4. Maintain backward compatibility for older versions

Potential future additions:
- V4: Add compression for very large skill lists

## Usage Examples

### Export a Character

```typescript
import { encodeSingleUma, charaToSingleExport } from './singleExport';

// Convert full CharaData to export format
const exportData = charaToSingleExport(myCharacter);

// Encode to Base64 string
const code = encodeSingleUma(exportData);

// Copy to clipboard
await navigator.clipboard.writeText(code);
```

### Import a Character

```typescript
import { decodeSingleUma } from './singleExport';

// Decode from Base64 string
const decoded = decodeSingleUma(code);

if (decoded) {
  console.log('Card ID:', decoded.card_id);
  console.log('Speed:', decoded.speed);
  console.log('Created:', decoded.create_time);
  console.log('Rank Score:', decoded.rank_score ?? 'N/A');
  console.log('Skills:', decoded.skill_array.length);
}
```

## Version History

### Version 2 (Current)
- Added `create_time` as a 32-bit Unix timestamp in seconds
- Added optional `rank_score` with 1-bit presence flag + 15-bit value
- Minimum payload size increased from 129 → 162 bits

### Version 1
- Initial release
- Supported card_id, stats, aptitudes, and skills
- Skills support levels 1-16 (4 bits per level)
- Maximum 63 skills (6-bit count field, same as full roster)
- No compression (codes are already compact)
