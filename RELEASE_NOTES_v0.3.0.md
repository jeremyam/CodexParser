# CodexParser 0.3.0

Added `convertVersion(targetVersion)` method on passage objects for versification conversion.

## Features

- **New Method**: `passage.convertVersion(targetVersion)` accepts version string (`"eng"`, `"lxx"`, `"mt"`, or `"bhs"`).
- **Smart Conversion**: Automatically converts chapter/verse references between versifications when versification data exists (e.g., Psalms, Zechariah).
- **Fallback Behavior**: Returns same reference with updated version metadata if no versification exists (e.g., NT passages).
- **Tested**: Verified with Psalms, Zechariah, and NT passages.

## Usage Example

```javascript
const CodexParser = require("codexparser")
const parser = new CodexParser()

// Convert English reference to LXX
const [p] = parser.parse("Psalm 4:5").getPassages()
console.log(p.scripture.hash) // "Ps.4.5"

const lxx = p.convertVersion("lxx")
console.log(lxx.scripture.hash) // "Ps.4.6"

// No versification (NT) - returns same reference
const [j] = parser.parse("John 3:16").getPassages()
const jLxx = j.convertVersion("lxx")
console.log(jLxx.scripture.hash) // "John.3.16" (same)
console.log(jLxx.version.abbreviation) // "lxx" (version updated)
```

See full CHANGELOG: https://github.com/jeremyam/CodexParser/blob/main/CHANGELOG.md
