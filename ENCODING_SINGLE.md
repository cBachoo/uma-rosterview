# Single Uma Export Encoding

This document describes the encoding format used for exporting individual uma data in the Uma Musume Roster Viewer.

## Overview

The single uma export format is a simplified, compact encoding designed for sharing individual character data. It includes only the essential information needed to represent an uma's trained state: stats, aptitudes, and skills.

The encoding uses a binary vector format converted to URL-safe Base64, making it suitable for copying/pasting or embedding in URLs.

## What's Included

The single export format includes:
- **Card ID**: Character card identifier
- **Base Statistics**: Speed, Stamina, Power, Guts, Wisdom
- **Aptitudes**: Distance (Short/Mile/Middle/Long), Ground (Turf/Dirt), Running Style (Nige/Senko/Sashi/Oikomi)
- **Skills**: All learned skills with their levels (1-16)

## What's NOT Included

The following fields are excluded to keep the encoding compact:
- Talent level
- Rank score
- Rarity
- Character seed
- Factors (sparks)
- Parent information
- Support cards
- Create time
- Win saddle IDs

## Encoding Specification - Version 1

### Notation

- **Lengths in bits** are fixed values determined by the maximum possible values
- **Values are unsigned integers** unless otherwise specified
- **Base64** uses URL-safe alphabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`

### Binary Format

#### 1. Header (8 bits)

| Field   | Length (bits) | Type    | Range     |
|---------|---------------|---------|-----------|
| Version | 8             | `uint8` | [0, 255]  |

The version field identifies the encoding format. Current version is **1**.

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

##### 2.3 Aptitudes (30 bits total)

| Field                        | Length (bits) | Type    | Range   |
|------------------------------|---------------|---------|---------|
| proper_distance_short        | 3             | `uint8` | [0, 7]  |
| proper_distance_mile         | 3             | `uint8` | [0, 7]  |
| proper_distance_middle       | 3             | `uint8` | [0, 7]  |
| proper_distance_long         | 3             | `uint8` | [0, 7]  |
| proper_ground_turf           | 3             | `uint8` | [0, 7]  |
| proper_ground_dirt           | 3             | `uint8` | [0, 7]  |
| proper_running_style_nige    | 3             | `uint8` | [0, 7]  |
| proper_running_style_senko   | 3             | `uint8` | [0, 7]  |
| proper_running_style_sashi   | 3             | `uint8` | [0, 7]  |
| proper_running_style_oikomi  | 3             | `uint8` | [0, 7]  |

Aptitudes range from 1-8 in the game (G to S rank). They are stored as `aptitude - 1`, mapping the range to 0-7.

**Aptitude Grades:**
- 0 → G (worst)
- 1 → F
- 2 → E
- 3 → D
- 4 → C
- 5 → B
- 6 → A
- 7 → S (best)

##### 2.4 Skills (Variable length)

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

Minimum bits (no skills):
```
Version:       8 bits
card_id:      20 bits
Stats:        55 bits (11 × 5)
Aptitudes:    30 bits (3 × 10)
skill_count:   6 bits
Total:       119 bits minimum
            = 20 Base64 characters
```

With skills:
```
Base:         119 bits
Per skill:     24 bits
Total:        119 + (24 × skill_count) bits
```

### Examples

**Character with 10 skills:**
```
119 + (24 × 10) = 359 bits
                = 60 Base64 characters
```

**Character with 30 skills:**
```
119 + (24 × 30) = 839 bits
                = 140 Base64 characters
```

**Character with 63 skills (maximum):**
```
119 + (24 × 63) = 1,631 bits
                 = 272 Base64 characters
```

### Typical Size Range

| Skill Count | Approximate Length |
|-------------|-------------------|
| 0-10        | 50-80 chars       |
| 10-20       | 80-120 chars      |
| 20-30       | 120-160 chars     |
| 30-50       | 160-240 chars     |
| 50-63       | 240-280 chars     |

Most trained uma have 8-20 skills, resulting in codes of **60-130 characters** - very compact and easy to copy/paste.

## Encoding Process

1. Create a BitVector instance
2. Write version header (8 bits, value = 1)
3. Write card_id (20 bits)
4. Write stats in order: speed, stamina, power, guts, wiz (11 bits each)
5. Write aptitudes in order: distances, grounds, styles (3 bits each, subtract 1 from actual value)
6. Write skill_count (6 bits, max 63)
7. For each skill:
   - Write skill_id (20 bits)
   - Write level - 1 (4 bits)
8. Pad bit vector to multiple of 6
9. Convert to URL-safe Base64

## Decoding Process

1. Convert Base64 string to BitVector
2. Check minimum bits (119)
3. Read version (8 bits), verify it's 1
4. Read card_id (20 bits)
5. Read stats (5 × 11 bits each)
6. Read aptitudes (10 × 3 bits each), add 1 to each value
7. Read skill_count (6 bits)
8. For each skill:
   - Read skill_id (20 bits)
   - Read level (4 bits), add 1 for actual level
9. Return SingleExportData object

## Error Handling

### Encoding Errors
- Stats are clamped to 0-2047 if they exceed the range
- Skill levels are clamped to 0-15 (representing 1-16)
- Only the first 63 skills are encoded if more are present

### Decoding Errors
- Returns `null` if insufficient bits for minimum character data
- Returns `null` if version doesn't match (expected: 1)
- Logs errors to console for debugging
- Stops reading skills if insufficient bits remain

## Comparison with Full Roster Encoding

| Feature              | Single Export | Full Roster |
|----------------------|---------------|-------------|
| Version              | 1             | 4           |
| Per Character        | 60-280 chars  | 200-250 chars |
| Factors              | ❌            | ✅          |
| Parents              | ❌            | ✅          |
| Rank Score           | ❌            | ✅          |
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
- V2: Add optional fields (factors, parents) with flags
- V3: Include rank score and talent level
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
  console.log('Skills:', decoded.skill_array.length);
}
```

## Version History

### Version 1 (Current)
- Initial release
- Supports card_id, stats, aptitudes, and skills
- Skills support levels 1-16 (4 bits per level)
- Maximum 63 skills (6-bit count field, same as full roster)
- No compression (codes are already compact)
