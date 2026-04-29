# CodexParser: The Ultimate Bible Reference Parser 📖✨

[![GitHub Release](https://img.shields.io/github/v/release/jeremyam/CodexParser?sort=semver)](https://github.com/jeremyam/CodexParser/releases)

Welcome to **CodexParser**, a powerful and flexible Node.js library crafted to parse, validate, and structure Bible references with ease. Whether you're extracting verses from a sermon, building a scripture app, or analyzing biblical texts, CodexParser transforms raw references like "John 3:16" or "Psalm 115:5,7,10" into rich, actionable data—complete with start and end points, SBL-style abbreviations, versification support, and validation. Dive into the Word like never before!

Built with precision and passion, CodexParser handles single verses, ranges, multi-chapter spans, and single-chapter books (looking at you, Jude!). It’s your trusty companion for navigating the sacred texts, supporting English, Septuagint (LXX), and Masoretic Text (MT) versions. Let’s unleash its power!

---

## Features 🌟

-   **Parse Any Reference**: From "Jn 3:16" to "Psalm 115:5,7,10", it's got you covered.
-   **Structured Output**: Get book, chapter, verses, testament, start/end points, SBL abbreviations, and versification data in a clean object.
-   **SBL Abbreviations**: Formatted references (e.g., "Ps. 115:5, 7, 10", "Gen. 1:1–3") with periods, en dashes for ranges, and commas with spaces for separated verses.
-   **Versification Support**: Handles differences between English, LXX, and MT texts — including the Greek additions to Esther (A–F) and Daniel (Susanna ch 13, Bel ch 14).
-   **Göttingen vs. Rahlfs Editions**: Default to Göttingen where attested, fall back to Rahlfs elsewhere; switch with `parser.edition("rahlfs")`.
-   **Letter-Suffixed Verses**: Hanhart's Esther additions (`1:1a`–`1:1s`, `4:17a`–`4:17z`, etc.) round-trip through `convertVersion` with `verseSuffix` carried through `scripture.cv`.
-   **Validation**: Checks if verses exist, with detailed error messages for invalid references.
-   **Combine Passages**: Merge multiple references into a single, cohesive range.
-   **Chainable API**: Fluent, intuitive method chaining for a smooth workflow.

---

## Installation 🚀

Grab CodexParser via npm and start parsing scripture in minutes:

```bash
npm install codexparser
```

Or clone it from GitHub and dive into the source:

```bash
git clone https://github.com/jeremyam/CodexParser.git
cd CodexParser
npm install
```

---

## Quick Start ⚡

For version detection and switching examples, see [Versions & Versification](#versions--versification).

Here’s how to wield CodexParser’s might:

```javascript
const CodexParser = require("codexparser")

const parser = new CodexParser()

// Parse comma-separated verses with LXX version
parser.bibleVersion("lxx").parse("Psalm 115:5,7,10")
console.log(parser.getPassages().first())
// Output: {
//   original: "Psalm 115:5,7,10",
//   book: "Psalms",
//   chapter: 115,
//   verses: [5, 7, 10],
//   type: "comma_separated_verses",
//   testament: "old",
//   index: 0,
//   version: { name: "Septuagint", value: "LXX", abbreviation: "lxx" },
//   passages: [
//     {
//       book: "Psalms",
//       chapter: 115,
//       verse: 5,
//       versification: { lxx: "115:5", mt: "116:14", eng: "116:14" }
//     },
//     {
//       book: "Psalms",
//       chapter: 115,
//       verse: 7,
//       versification: { lxx: "115:7", mt: "116:16", eng: "116:16" }
//     },
//     {
//       book: "Psalms",
//       chapter: 115,
//       verse: 10,
//       versification: { lxx: "115:10", mt: "116:19", eng: "116:19" }
//     }
//   ],
//   scripture: {
//     passage: "Psalms 115:5,7,10",
//     cv: "115:5,7,10",
//     hash: "psalms_115.5,7,10"
//   },
//   valid: true,
//   start: { book: "Psalms", chapter: 115, verse: 5 },
//   end: { book: "Psalms", chapter: 115, verse: 10 },
//   abbr: "Ps. 115:5, 7, 10",
//   reference: [Function]
// }

// Parse a verse range
console.log(parser.bibleVersion("eng").parse("Genesis 1:1-5").getPassages().first().abbr)
// Output: "Gen. 1:1–5"

// Chain it up!
console.log(parser.parse("Genesis 1:1-5, 10; 2:1-3").getPassages().combine())
// Combines into a single passage with start/end spanning the range!
```

---

## Versions & Versification 🔁

CodexParser supports English (`ENG`), Septuagint (`LXX`), and Masoretic (`MT`/`BHS`) versifications. You can set a default via `.bibleVersion()` or use per-passage helpers to convert.

- Set default version for parsing:

```javascript
const CodexParser = require("codexparser")
const parser = new CodexParser()

// Default LXX if no suffix in the input
parser.bibleVersion("lxx")
const [p] = parser.parse("Psalms 4:5").getPassages()
console.log(p.version.abbreviation) // "lxx"
console.log(p.scripture.hash)       // "Ps.4.5"

// Convert to English versification
const eng = p.getEnglish()
console.log(eng.scripture.cv)       // "4:4" (example of LXX→ENG shift)
```

- Detect version from suffix and convert across versions:

```javascript
const CodexParser = require("codexparser")
const parser = new CodexParser()

// Suffix sets version automatically
const passages = parser.parse("Psalms 94:4-100:6 MT").getPassages()
const base = passages[0]
console.log(base.version.abbreviation) // "mt"
console.log(base.scripture.hash)       // e.g., "Ps.94.4-Ps.100.6"

// Convert to LXX and ENG with helpers
const lxx = base.getLXX()
const eng = base.getEnglish()
console.log(lxx.scripture.cv) // "93:4-23; 94:1-11; ..." (mapped LXX ranges)
console.log(eng.scripture.cv) // "94:4-23; 95:1-11; ..." (ENG/MT alignment)
```

- Zechariah example (chapter offsets):

```javascript
const parser = new CodexParser()
const [z] = parser.parse("Zechariah 2:8").getPassages()
console.log(z.getEnglish().scripture.hash) // "Zech.2.8"
console.log(z.getLXX().scripture.hash)     // "Zech.2.12" (LXX mapping)
```

Notes:
- `getVersion("eng"|"lxx"|"mt"|"bhs")` is available; `getBHS()` aliases `MT`.
- `.scripture.hash` is OSIS textual (e.g., `John.3.16`), `.osisNumeric` uses pythonbible-style integer IDs.

### Editions: Göttingen vs. Rahlfs

CodexParser defaults to **Göttingen** versification where the critical edition exists and falls back to **Rahlfs** where it doesn't (per `src/data/lxx-editions.js`). Switch with `.edition()`:

```javascript
const parser = new CodexParser()

// Default: "auto" (Göttingen-where-attested, Rahlfs-elsewhere)
const [a] = parser.parse("Genesis 31:55").getPassages()
console.log(a.getLXX().scripture.cv)               // "32:1" (Wevers Genesis)

// Force Rahlfs across the whole parser
parser.edition("rahlfs")
const [b] = parser.parse("Genesis 31:55").getPassages()
console.log(b.getLXX().scripture.cv)               // same here; would differ in books with `lxxRahlfs` overrides

// Per-call override (no need to switch the whole parser)
const [c] = parser.parse("Esther 1:1").getPassages()
console.log(c.convertVersion("lxx", { edition: "rahlfs" }).scripture.cv)
console.log(c.getLXXRahlfs().scripture.cv)         // helper equivalent
```

### Greek additions: Esther A–F and Daniel 13/14

`Esther 11:2`–`16:24` (Vulgate / RSV-Apocrypha numbering) and `Daniel 13`/`14` (Susanna, Bel & the Dragon) parse and convert. Hanhart's letter-suffixed positions (`1:1a`, `4:17a`, `8:12x`, …) are carried through `verseSuffix`.

```javascript
const parser = new CodexParser()

// Esther Addition A: ENG 11:2 -> LXX 1:1a
const [e] = parser.parse("Esther 11:2").getPassages()
const eLxx = e.convertVersion("lxx")
console.log(eLxx.scripture.cv)                     // "1:1a"
console.log(eLxx.passages[0].verseSuffix)          // "a"
console.log(eLxx.passages[0].chapter, eLxx.passages[0].verse) // 1, 1

// Susanna (Daniel 13) parses canonically
const [s] = parser.parse("Daniel 13:1").getPassages()
console.log(s.valid)                               // true
const sMt = s.convertVersion("mt")
console.log(sMt.missingPassages?.length)           // 1 (LXX-only chapter)

// Range / missing-in-target verses don't NaN-out
const [g] = parser.parse("Genesis 31:48").getPassages()
console.log(g.getLXX().scripture.cv)               // "31:47-48" (range)
const [k] = parser.parse("1 Kings 4:21").getPassages()
console.log(k.getLXX().missingPassages[0].missingIn) // "lxx"
```

---

## API: Your Codex Arsenal 🛠️

Here’s the breakdown of CodexParser’s key methods—your tools for mastering scripture:

### `new CodexParser()`

-   **What it does**: Creates a new parser instance, ready to tackle any reference.
-   **Usage**: `const parser = new CodexParser();`

### `.scan(text)`

-   **What it does**: Scans a string for Bible references, storing raw matches in `this.found`. It’s the first step in parsing—think of it as your scripture radar.
-   **Args**: `text` (string) - The text to search (e.g., "Preaching from Jn 3:16 today").
-   **Returns**: The parser instance for chaining.
-   **Example**: `parser.scan("Jn 3:16; Gen 1:1");`

### `.parse(reference)`

-   **What it does**: Takes a reference string, scans it, and builds structured passage objects with `start`, `end`, `passages`, SBL abbreviations, versification, and validation. This is your main parsing powerhouse.
-   **Args**: `reference` (string) - The Bible reference (e.g., "Psalm 115:5,7,10").
-   **Returns**: The parser instance for chaining.
-   **Example**: `parser.parse("Exodus 20:1-5").getPassages();`

### `.bibleVersion(version)`

-   **What it does**: Sets the Bible version (e.g., "lxx", "mt", "eng") to adjust versification. Great for Old Testament nerds!
-   **Args**: `version` (string) - Version code ("lxx", "mt", "eng", etc.).
-   **Returns**: The parser instance for chaining.
-   **Example**: `parser.bibleVersion("lxx").parse("Psalm 115:5,7,10");`

### `.edition(edition)`

-   **What it does**: Selects the LXX edition. `"auto"` (default) uses Göttingen where attested per `src/data/lxx-editions.js` and Rahlfs elsewhere. `"rahlfs"` forces Rahlfs versification universally and consults `lxxRahlfs` overrides where present.
-   **Args**: `edition` (string) - `"auto"` or `"rahlfs"`.
-   **Returns**: The parser instance for chaining.
-   **Example**: `parser.edition("rahlfs").parse("Esther 11:2");`

### `passage.convertVersion(target, options?)` / `passage.getLXXRahlfs()`

-   **What it does**: Converts a parsed passage to another versification. `target` is `"eng"`, `"lxx"`, `"mt"`, or `"bhs"`. The optional `options.edition` (`"rahlfs"` or `"auto"`) overrides the parser-level edition for this single call. `getLXXRahlfs()` is a shortcut for `convertVersion("lxx", { edition: "rahlfs" })`.
-   **Returns**: A cloned passage with `chapter` / `verse` / `verseSuffix` remapped, plus `cloned.missingPassages` listing any sub-passages that don't exist in the target version.
-   **Example**:
    ```javascript
    const [p] = parser.parse("Esther 11:2").getPassages()
    p.convertVersion("lxx").scripture.cv          // "1:1a"
    p.convertVersion("mt").missingPassages.length // 1 (Add A is LXX-only)
    ```

### `.getPassages()`

-   **What it does**: Returns an array of parsed passage objects with handy methods like `.first()`, `.oldTestament()`, `.newTestament()`, and `.combine()`.
-   **Returns**: Array of passage objects with extra methods.
-   **Example**: `parser.parse("Matt 5:3-5").getPassages();`

### `.first()`

-   **What it does**: Grabs the first parsed passage—perfect for single-reference parsing.
-   **Returns**: The first passage object or `null` if none exist.
-   **Example**: `parser.parse("Luke 2:1").first();`

### `.combine(passages)`

-   **What it does**: Merges multiple passages from the same book into a single passage, calculating a unified range with `start` and `end`. Ideal for consolidating overlapping references.
-   **Args**: `passages` (array) - Array of passage objects to combine.
-   **Returns**: A combined passage object.
-   **Example**:
    ```javascript
    const passages = parser.parse("John 3:16, 3:17-18").getPassages()
    const combined = parser.combine(passages)
    // Result: A single "John 3:16-18" passage
    ```

### `.getToc(version)`

-   **What it does**: Generates a table of contents with books and their chapter/verse counts. Useful for reference or validation.
-   **Args**: `version` (string, optional) - Bible version (defaults to "ESV").
-   **Returns**: Object mapping books to chapter/verse data.
-   **Example**: `console.log(parser.getToc());`

### Passage Object Structure

Each parsed passage looks like this:

```javascript
{
  original: "Psalm 115:5,7,10",       // Original input
  book: "Psalms",                    // Full book name
  chapter: 115,                      // Starting chapter
  verses: [5, 7, 10],                // Verse list
  type: "comma_separated_verses",    // Reference type
  testament: "old",                  // Old or New Testament
  index: 0,                          // Position in text
  version: { name: "Septuagint", value: "LXX", abbreviation: "lxx" }, // Version info
  passages: [                        // Expanded verses
    {
      book: "Psalms",
      chapter: 115,
      verse: 5,
      versification: { lxx: "115:5", mt: "116:14", eng: "116:14" }
    },
    {
      book: "Psalms",
      chapter: 115,
      verse: 7,
      versification: { lxx: "115:7", mt: "116:16", eng: "116:16" }
    },
    {
      book: "Psalms",
      chapter: 115,
      verse: 10,
      versification: { lxx: "115:10", mt: "116:19", eng: "116:19" }
    }
  ],
  scripture: {                       // Formatted output
    passage: "Psalms 115:5,7,10",
    cv: "115:5,7,10",
    hash: "psalms_115.5,7,10"
  },
  valid: true,                       // Validation status
  start: { book: "Psalms", chapter: 115, verse: 5 }, // First verse
  end: { book: "Psalms", chapter: 115, verse: 10 },  // Last verse
  abbr: "Ps. 115:5, 7, 10",          // SBL-style abbreviation with period, comma spaces
  reference: [Function]              // Method to get scripture.passage
}
```

---

## Supported Reference Types 📜

-   **Single Chapter**: `Jude 1` (whole chapter of a single-chapter book).
-   **Chapter Verse**: `John 3:16` (one verse).
-   **Chapter Verse Range**: `Genesis 1:1-5` (verse range in one chapter).
-   **Comma Separated Verses**: `Psalm 115:5,7,10` (multiple verses in one chapter).
-   **Chapter Range**: `Exodus 20-22` (full chapters).
-   **Multi-Chapter Verse Range**: `Psalm 119:1-120:5` (spans chapters).

---

## Contributing 🙌

Want to enhance CodexParser? Fork it, tweak it, and send a pull request! Issues and ideas are welcome on the [GitHub Issues page](https://github.com/jeremyam/CodexParser/issues).

---

## License ⚖️

[MIT License](LICENSE) - Free to use, modify, and share. Spread the Word!

---

## Acknowledgements 🌍

Built with love by [jeremyam], powered by coffee and scripture.

---

Let’s parse the scriptures together—happy coding! ✝️📚

---

## Release Notes

### 0.4.0 (2026-04-28)

LXX versification audit + structural fixes. Major data-correctness pass against authoritative sources (Hanhart's Göttingen Esther, Rahlfs-Hanhart 2006, Göttingen Theodotion Susanna/Daniel/Bel) verified against a Logos library extract.

- New `parser.edition("rahlfs"|"auto")` setter and `passage.convertVersion(target, { edition })` per-call override; `passage.getLXXRahlfs()` helper.
- `ReferenceParser.expandVersificationValue()` parses `"ch:v"`, `"ch:v1-v2"`, `"ch:v[a-z]"`, and rejects empty/malformed input cleanly. The previously-broken cases (Gen 31:48 LXX `"31:47-48"`, 1 Kgs 4:21 LXX `""`, Isa 64:1 MT `"63:19b"`, Dan 3:24a) all parse correctly.
- `verseSuffix` is now carried through `scripture.cv`, `verses[]`, `original`, and `abbr` so `Esther 11:2 ENG → LXX` produces `Esther 1:1a` (not `1:1`).
- `cloned.missingPassages` is populated when a verse doesn't exist in the conversion target (e.g., 1 Kgs 4:21 LXX, Daniel 13 in MT).
- New `src/data/lxx-editions.js` registry; new `versifications/2kings.js`, `versifications/esther.js` (Hanhart-verified Vulgate ↔ Rahlfs Add A–F mapping); `chapter_verses` extended for Daniel 13/14 (Susanna + Bel) and Esther 10–16 (Vulgate apocrypha layout); `Song of Solomon` aliased to `Song of Songs`.
- **116 MT-side bugs fixed** across Genesis 31:55–32:32, 1 Samuel 23:29, 2 Samuel 18:33–19:43, Psalms 92:0, Ezekiel 20:45–21:32 — entries that incorrectly left `mt = eng` when MT actually shifts. Verified against BHS data.
- `numbers.js` corrupted final entry replaced + Num 30 added; `micah.js` rewritten; `psalms.js` Ps 147 boundary corrected from 9/10 to 11/12; `genesis.js` 35:16 no-op removed.
- 77 assertion-based tests in `tests/lxx-versification-audit.test.js`. All passing.
- Published to npm as `codexparser@0.4.0`.

### 0.3.0 (2026-01-10)

- Added `convertVersion(targetVersion)` method on passage objects for versification conversion.
- Accepts version string: `"eng"`, `"lxx"`, `"mt"`, or `"bhs"` (alias for MT).
- Automatically converts chapter/verse references between versifications when versification data exists.
- Returns same reference with updated version metadata if no versification exists.
- Tested with Psalms, Zechariah, and NT passages.
- Published to npm as `codexparser@0.3.0`.

### 0.2.0 (2026-01-10)

- Refactored internal architecture into clear folders:
  - `src/core` (parser, scanner, validator, collection, version/versification handlers)
  - `src/utils` (helpers, regex, chapter-verse data loader)
  - `src/format` (OSIS formatter, abbreviations)
  - `src/data` (bible lists, chapter_verses, versifications, sbl abbreviations)
- Adopted OSIS textual hashes (e.g., `John.3.16`, `Rev.1.8-Rev.2.17`).
- Added numeric OSIS using pythonbible-style integer verse IDs (`book*1_000_000 + chapter*1_000 + verse`).
- Attached per-passage version helpers: `getVersion()`, `getLXX()`, `getMT()`, `getBHS()`, `getEnglish()`.
- Cleaned dependencies and removed vulnerable toolchain; `npm audit` is clean.
- Published to npm as `codexparser@0.2.0`.
