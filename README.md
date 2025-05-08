# CodexParser: The Ultimate Bible Reference Parser 📖✨

Welcome to **CodexParser**, a powerful and flexible Node.js library crafted to parse, validate, and structure Bible references with ease. Whether you're extracting verses from a sermon, building a scripture app, or analyzing biblical texts, CodexParser transforms raw references like "John 3:16" or "Psalm 115:5,7,10" into rich, actionable data—complete with start and end points, SBL-style abbreviations, versification support, and validation. Dive into the Word like never before!

Built with precision and passion, CodexParser handles single verses, ranges, multi-chapter spans, and single-chapter books (looking at you, Jude!). It’s your trusty companion for navigating the sacred texts, supporting English, Septuagint (LXX), and Masoretic Text (MT) versions. Let’s unleash its power!

---

## Features 🌟

-   **Parse Any Reference**: From "Jn 3:16" to "Psalm 115:5,7,10", it’s got you covered.
-   **Structured Output**: Get book, chapter, verses, testament, start/end points, SBL abbreviations, and versification data in a clean object.
-   **SBL Abbreviations**: Formatted references (e.g., "Ps. 115:5, 7, 10", "Gen. 1:1–3") with periods, en dashes for ranges, and commas with spaces for separated verses.
-   **Versification Support**: Handles differences between English, LXX, and MT texts, with mappings like Psalm 115 (LXX) to Psalm 116 (MT/ENG).
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
