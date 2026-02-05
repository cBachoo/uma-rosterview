# Overview

This is a technical overview of the encoding system used by Uma Musume Roster Viewer.
The encoding uses a binary vector to store all relevant information about trained characters in a compact manner, and then converts the resulting vector into URL-safe Base64, storing it in the Site's URL hash (the string of characters preceded by a "#" symbol).

The encoder encodes the following information per character:
- Character card ID
- Talent level
- Rank score (optional)
- Base statistics (speed, stamina, power, guts, wisdom)
- Aptitudes for distances, ground types, and running styles
- Inherited factors (sparks)
- Learned skills with levels
- Parent characters with their factors

All IDs are stored directly in the binary format. The encoding is designed to be compact while preserving all character information necessary for sharing and comparison.

For URLs with multiple characters, the encoded data is automatically compressed using gzip (via the CompressionStream API) to reduce size by approximately 60-70%. The decoder automatically detects and handles both compressed and uncompressed formats.

# Specification - V4

This section details each part of the encoded vectors and how to interpret them.

## Notation

- **Lengths in bits** are fixed values determined by the maximum possible values in the game data
- **Values are unsigned integers** unless otherwise specified
- **Ranges** show the possible values that can be stored
- **Base64** uses URL-safe alphabet: `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`


## Section A - Character Encoding

### 1 - Encoding Header

| field   | length (in bits) | values   | range   |
| ------- | ---------------- | -------- | ------- |
| Version | 8                | `uint8`  | [0, 255] |

The version field identifies the encoding format. Current version is 4.

There is no character count field. The decoder reads characters until the bit stream is exhausted. The minimum number of bits required per character is 109 (without any factors, skills, or parents).

### 2 - Character Data

Each character is encoded sequentially with the following fields.

#### 2.1 - Basic Information

| field            | length (in bits) | values   | range       |
| ---------------- | ---------------- | -------- | ----------- |
| card_id          | 20               | `uint32` | [0, 1048575] |
| talent_level     | 3                | `uint8`  | [0, 4]       |
| rank_score_flag  | 1                | `uint8`  | [0, 1]       |
| rank_score       | 15 (conditional) | `uint16` | [0, 32767]   |

The `card_id` identifies the character card. The `talent_level` is stored as `actual_level - 1`, so values 1-5 are stored as 0-4.

The `rank_score_flag` indicates whether the character has a rank score:
- 0: No rank_score (rank_score field is not encoded)
- 1: Has rank_score (rank_score field follows, 15 bits)

The `rank_score` field is only present if `rank_score_flag` is 1. It stores the character's total rank score (0-32767).

#### 2.2 - Statistics

| field   | length (in bits) | values   | range    |
| ------- | ---------------- | -------- | -------- |
| speed   | 11               | `uint16` | [0, 2047] |
| stamina | 11               | `uint16` | [0, 2047] |
| power   | 11               | `uint16` | [0, 2047] |
| guts    | 11               | `uint16` | [0, 2047] |
| wiz     | 11               | `uint16` | [0, 2047] |

All statistics are 11 bits, supporting values from 0 to 2047. Values are clamped to this range during encoding.

#### 2.3 - Aptitudes

| field                        | length (in bits) | values  | range |
| ---------------------------- | ---------------- | ------- | ----- |
| proper_distance_short        | 3                | `uint8` | [0, 7] |
| proper_distance_mile         | 3                | `uint8` | [0, 7] |
| proper_distance_middle       | 3                | `uint8` | [0, 7] |
| proper_distance_long         | 3                | `uint8` | [0, 7] |
| proper_ground_turf           | 3                | `uint8` | [0, 7] |
| proper_ground_dirt           | 3                | `uint8` | [0, 7] |
| proper_running_style_nige    | 3                | `uint8` | [0, 7] |
| proper_running_style_senko   | 3                | `uint8` | [0, 7] |
| proper_running_style_sashi   | 3                | `uint8` | [0, 7] |
| proper_running_style_oikomi  | 3                | `uint8` | [0, 7] |

Aptitudes range from 1-8 in the game. They are stored as `aptitude - 1`, mapping the range to 0-7.

#### 2.4 - Factors

| field        | length (in bits) | values   | range        |
| ------------ | ---------------- | -------- | ------------ |
| factor_count | 4                | `uint8`  | [0, 15]      |
| factor_id    | 24 (per factor)  | `uint32` | [0, 16777215] |

The `factor_count` field indicates how many factors (sparks) the character has inherited. Each factor ID is then encoded sequentially using 24 bits. The maximum number of factors that can be encoded is 15.

Factor IDs use 24 bits to support IDs up to 16,777,215. Maximum factor_id in current game data is 10,610,102.

#### 2.5 - Skills

| field       | length (in bits) | values   | range       |
| ----------- | ---------------- | -------- | ----------- |
| skill_count | 6                | `uint8`  | [0, 63]     |
| skill_id    | 20 (per skill)   | `uint32` | [0, 1048575] |
| skill_level | 1 (per skill)    | `uint8`  | [0, 1]       |

The `skill_count` field indicates how many skills the character has learned. Maximum is 63 skills.

Each skill consists of:
- `skill_id`: 20 bits (supports IDs up to 1,048,575, max in game data is 910,241)
- `skill_level`: 1 bit flag indicating if level > 1
  - 0: level is 1
  - 1: level is 2 or higher

Note: The skill level encoding is simplified. It only distinguishes between level 1 and level 2+. Full level information (1-8) is not preserved in the current encoding.

#### 2.6 - Parents

| field        | length (in bits) | values   | range   |
| ------------ | ---------------- | -------- | ------- |
| parent_count | 2                | `uint8`  | [0, 3]  |

The `parent_count` field indicates how many parent characters are encoded. Maximum is 3 parents.

For each parent, the following fields are encoded:

| field               | length (in bits) | values   | range        |
| ------------------- | ---------------- | -------- | ------------ |
| card_id             | 20               | `uint32` | [0, 1048575] |
| talent_level        | 3                | `uint8`  | [0, 4]       |
| parent_factor_count | 4                | `uint8`  | [0, 15]      |
| parent_factor_id    | 24 (per factor)  | `uint32` | [0, 16777215] |

Parent data follows the same encoding rules as the main character:
- `card_id` and `talent_level` use the same bit lengths
- Each parent's factors are encoded with a count followed by factor IDs
- Maximum 15 factors per parent

### 3 - Base64 Encoding

After all characters are encoded into the bit vector, the vector is padded to a multiple of 6 bits (to align with Base64 encoding), then converted to URL-safe Base64.

The URL-safe Base64 alphabet is:
```
ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_
```

This differs from standard Base64 which uses `+` and `/`. The URL-safe variant uses `-` and `_` instead, and omits padding characters (`=`).

## Section B - Compression

The encoding supports optional gzip compression to reduce URL length. Compression is applied after Base64 encoding.

### 1 - Compression Format

| field              | description                                  |
| ------------------ | -------------------------------------------- |
| Format indicator   | Single character 'z' prefix                  |
| Compressed data    | Gzipped binary data, converted to Base64     |

If the first character of the encoded string is 'z', the remaining string is:
1. Converted from URL-safe Base64 to binary
2. Decompressed using gzip
3. Converted back to URL-safe Base64
4. Decoded using the standard character decoding process

If there is no 'z' prefix, the string is decoded directly without decompression.

### 2 - Compression Algorithm

Compression uses the gzip algorithm via the browser's CompressionStream API:
```javascript
const stream = new Blob([data])
  .stream()
  .pipeThrough(new CompressionStream('gzip'));
```

Decompression uses DecompressionStream:
```javascript
const stream = new Blob([data])
  .stream()
  .pipeThrough(new DecompressionStream('gzip'));
```

### 3 - Compression Characteristics

Typical compression ratios:
- 5 characters: 1,102 chars -> ~400 chars (64% reduction)
- 10 characters: 2,202 chars -> ~800 chars (64% reduction)
- 20 characters: 4,402 chars -> ~1,600 chars (64% reduction)

Compression is only applied if it actually reduces the size. For very small data (1-2 characters), gzip overhead may make the result larger, in which case uncompressed format is used.

### 4 - Browser Compatibility

CompressionStream API support:
- Chrome 80+
- Firefox 113+
- Safari 16.4+
- Edge 80+

For browsers without support, the encoder gracefully falls back to uncompressed format. The decoder can handle both compressed and uncompressed formats regardless of browser support.

## Section C - Decoding Process

### 1 - Format Detection

1. Read the first character of the encoded string
2. If it is 'z', the data is compressed:
   - Remove the 'z' prefix
   - Convert from Base64 to binary
   - Decompress using gzip
   - Convert decompressed data to Base64
3. If it is not 'z', the data is uncompressed

### 2 - Version Check

1. Convert Base64 string to bit vector
2. Read first 8 bits as version number
3. Verify version is 4
4. If version mismatch, return empty result

### 3 - Character Decoding

For each character in the bit stream:

1. Check if at least 109 bits remain (minimum character size)
2. Read fields in order:
   - card_id (20 bits)
   - talent_level (3 bits), add 1 to get actual value
   - rank_score_flag (1 bit)
   - rank_score (15 bits, only if flag is 1)
   - Statistics (5 fields x 11 bits each)
   - Aptitudes (10 fields x 3 bits each), add 1 to each value
   - factor_count (4 bits)
   - For each factor: factor_id (24 bits)
   - skill_count (6 bits)
   - For each skill: skill_id (20 bits), level flag (1 bit)
   - parent_count (2 bits)
   - For each parent:
     - card_id (20 bits)
     - talent_level (3 bits)
     - parent_factor_count (4 bits)
     - For each parent factor: factor_id (24 bits)

3. Continue reading characters until fewer than 109 bits remain
4. Return array of decoded characters

### 4 - Default Values

When decoding, some fields are set to default values:
- `create_time`: Current timestamp
- `rarity`: 3
- `chara_seed`: Random value
- `support_card_list`: Empty array

These fields are not preserved in the encoding.

## Section D - Size Analysis

### Bit Breakdown per Character

Minimum bits per character (no factors, skills, or parents, no rank_score):
```
Version:       8 bits (once per encoding, not per character)
card_id:      20 bits
talent:        3 bits
rank_score:    1 bit (flag only, if no rank_score)
Stats:        55 bits (11 * 5)
Aptitudes:    30 bits (3 * 10)
Counts:       12 bits (4 + 6 + 2)
Total:       121 bits minimum per character
```

With rank_score:
```
Version:       8 bits (once per encoding, not per character)
card_id:      20 bits
talent:        3 bits
rank_score:   16 bits (1 bit flag + 15 bits value)
Stats:        55 bits (11 * 5)
Aptitudes:    30 bits (3 * 10)
Counts:       12 bits (4 + 6 + 2)
Total:       136 bits minimum per character with rank_score
```

Additional bits for variable data:
```
Factors:  (4 + 24 * count) bits per character
Skills:   (6 + 21 * count) bits per character  (20 for ID + 1 for level)
Parents:  (2 + 47 * count) bits per parent base
          + (4 + 24 * factor_count) bits per parent's factors
```

Average character with typical data (with rank_score, 6 factors, 9 skills, 6 parents each with 6 factors):
```
Base:      136 bits (includes 16-bit rank_score)
Factors:   148 bits (4 + 24*6)
Skills:    195 bits (6 + 21*9)
Parents:   858 bits (2 + 6*(47 + 4 + 24*6))
Total:    1337 bits per character
         = 223 Base64 characters (uncompressed)
         = ~81 Base64 characters (compressed)
```

### URL Length Estimates

| Characters | Uncompressed | Compressed | Status          |
| ---------- | ------------ | ---------- | --------------- |
| 1          | 222 chars    | ~100 chars | Excellent       |
| 5          | 1,102 chars  | ~400 chars | Good            |
| 10         | 2,202 chars  | ~800 chars | Acceptable      |
| 20         | 4,402 chars  | ~1,600 chars | Long but works |
| 50         | 11,002 chars | ~4,000 chars | Too long       |

Browser URL limits typically range from 2,000 to 8,000 characters depending on the browser. For optimal compatibility, keep URLs under 2,000 characters (approximately 10-12 characters with compression).

## Section E - Implementation Notes

### 1 - BitVector Class

The BitVector class manages the binary encoding:
- `write(value, bitLength)`: Writes a value using specified number of bits
- `read(bitLength)`: Reads a value using specified number of bits
- `toBase64()`: Converts bit vector to URL-safe Base64 string
- `fromBase64(str)`: Creates bit vector from URL-safe Base64 string

Bits are written and read in big-endian order (most significant bit first).

### 2 - Base64 Conversion

URL-safe Base64 conversion:
- Standard Base64: Uses `+`, `/`, and `=`
- URL-safe Base64: Uses `-`, `_`, and no padding

Conversion functions:
```javascript
// Standard to URL-safe
urlSafe = standard.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

// URL-safe to standard
standard = urlSafe.replace(/-/g, '+').replace(/_/g, '/')
```

### 3 - Error Handling

Decoding failures:
- Invalid Base64: Returns empty array
- Version mismatch: Logs error and returns empty array
- Insufficient bits: Stops decoding and returns partial results
- Decompression failure: Falls back to uncompressed decoding

All errors are logged to console for debugging.

### 4 - Future Extensibility

To add new encoding versions:
1. Increment ENCODING_VERSION constant
2. Add new encode/decode functions for the new format
3. Update version check in decoder to handle multiple versions
4. Maintain backward compatibility by keeping old decode functions

The current implementation only supports V4. Previous versions (V3, V2) are not supported and will return an empty result if detected.
