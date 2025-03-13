# CodexParser: The Ultimate Bible Reference Parser 📖✨

Welcome to **CodexParser**, a powerful and flexible Node.js library crafted to parse, validate, and structure Bible references with ease. Whether you're extracting verses from a sermon, building a scripture app, or analyzing biblical texts, CodexParser transforms raw references like "John 3:16" or "Genesis 1:1-5, 10" into rich, actionable data—complete with start and end points, versification support, and more. Dive into the Word like never before!

Built with precision and passion, CodexParser handles single verses, ranges, multi-chapter spans, and even single-chapter books (looking at you, Jude!). It’s your trusty companion for navigating the sacred texts, supporting English, Septuagint (LXX), and Masoretic Text (MT) versions. Let’s unleash its power!

---

## Features 🌟

-   **Parse Any Reference**: From "Jn 3:16" to "Exodus 20:1-17; 21:1-5", it’s got you covered.
-   **Structured Output**: Get book, chapter, verse, testament, start/end points, and more in a clean object.
-   **Versification Support**: Handles differences between English, LXX, and MT texts.
-   **Validation**: Ensures references are legit—no more phantom verses!
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
git clone https://github.com/your-username/CodexParser.git
cd CodexParser
npm install
```

---

## Quick Start ⚡

Here’s how to wield CodexParser’s might:

```javascript
const CodexParser = require("codex-parser")

const parser = new CodexParser()

// Parse a simple reference
parser.parse("John 3:16")
console.log(parser.getPassages().first())
// Output: {
//   original: "John 3:16",
//   book: "John",
//   chapter: 3,
//   verses: [16],
//   type: "chapter_verse",
//   testament: "new",
//   passages: [{ book: "John", chapter: 3, verse: 16 }],
//   scripture: { passage: "John 3:16", cv: "3:16", hash: "john_3.16" },
//   start: { book: "John", chapter: 3, verse: 16 },
//   end: { book: "John", chapter: 3, verse: 16 },
//   valid: true,
//   version: { name: "English", value: "ENG", abbreviation: "eng" }
// }

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

-   **What it does**: Takes a reference string, scans it, and builds structured passage objects with `start`, `end`, `passages`, and more. This is your main parsing powerhouse.
-   **Args**: `reference` (string) - The Bible reference (e.g., "John 3:16-18").
-   **Returns**: The parser instance for chaining.
-   **Example**: `parser.parse("Exodus 20:1-5").getPassages();`

### `.bibleVersion(version)`

-   **What it does**: Sets the Bible version (e.g., "lxx", "mt", "bhs") to adjust versification. Great for Old Testament nerds!
-   **Args**: `version` (string) - Version code ("lxx", "mt", "bhs", etc.).
-   **Returns**: The parser instance for chaining.
-   **Example**: `parser.bibleVersion("lxx").parse("Psalm 23:1");`

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
  original: "John 3:16-18",           // Original input
  book: "John",                      // Full book name
  chapter: 3,                        // Starting chapter
  verses: ["16-18"],                 // Verse range or list
  type: "chapter_verse_range",       // Reference type
  testament: "new",                  // Old or New Testament
  index: 0,                          // Position in text
  version: { name: "English", value: "ENG", abbreviation: "eng" }, // Version info
  passages: [{ book: "John", chapter: 3, verse: 16 }, ...], // Expanded verses
  scripture: { passage: "John 3:16-18", cv: "3:16-18", hash: "john_3.16.18" }, // Formatted output
  valid: true,                       // Validation status
  start: { book: "John", chapter: 3, verse: 16 }, // First verse
  end: { book: "John", chapter: 3, verse: 18 }    // Last verse
}
```

---

## Supported Reference Types 📜

-   **Single Chapter**: `Jude 1` (whole chapter of a single-chapter book).
-   **Chapter Verse**: `John 3:16` (one verse).
-   **Chapter Verse Range**: `Genesis 1:1-5` (verse range in one chapter).
-   **Comma Separated Verses**: `Matthew 5:3, 5, 7` (multiple verses in one chapter).
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

### Notes

-   Replace `your-username` with your actual GitHub username.
-   Add a `LICENSE` file to your repo if you choose MIT or another license.
-   If you have specific dependencies or setup steps (e.g., external data files like `chapterVerseCombine`), mention them under **Installation**.
-   Test the examples in your environment to ensure they match your output.
