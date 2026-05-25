# Changelog

All notable changes to this project are documented here. For full details, see the Release Notes in README and the GitHub Releases page.

## 0.5.3 — 2026-05-25

### Fixed

- **Scan character offsets (`startIndex`/`endIndex`/`originalText`) were wrong for references following punctuation or another reference.** Normalization in `ScriptureScanner.scan` deleted the period after a book abbreviation (`Ps.` → `Ps`), which shortened `normalizedText` and shifted every subsequent index out of alignment with the source `text`. The downstream `indexOf(fullRefText)` remap (which also searched for a `:`→`.` mangled form) then drifted, so e.g. scanning `… John 3:16 (cf. Lamentations 3:1)` returned `originalText: " John 3:1"` (leading space, truncated verse). Both normalization substitutions are now **length-preserving** (`Ps.` → `Ps `), and spans are taken directly from the scanner's own tracked indices with leading/trailing separator trimming. `text.slice(startIndex, endIndex) === originalText` now holds exactly, including abbreviated and numbered books (`1 Cor. 13:4`), semicolon lists (`Isa 1:1; 2:2` → `2:2` → `Isa. 2:2`), and trailing-comma cases.

### Added

- **En-dash / em-dash range support.** `3:22–24` and `3:22—24` (U+2013 / U+2014) are now parsed as ranges (previously only ASCII `-` was recognized, so `Lamentations 3:22–24` captured only `3:22`). Implemented as a length-preserving `–|— → -` substitution in `scan` normalization, so range hashes/abbreviations are complete (`Lam.3.22-Lam.3.24`) while `originalText` preserves the source dash.

## 0.5.2 — 2026-05-25

### Fixed

- **Minor Prophets LXX versification used Rahlfs instead of Göttingen.** Extending the 0.5.1 Zechariah fix to the other Göttingen-edition Minor Prophets the app reads. For each, `lxx` now carries the Göttingen number (verified against Göttingen *Duodecim Prophetae* XIII), not the Rahlfs/MT number:
  - **Hosea** — `lxx=eng` for ch1–2 and ch11–12; ch13/14 follows MT (ESV 13:16 = Göttingen 14:1), and the previously missing ESV 14:1–9 → 14:2–10 entries were added.
  - **Joel** — `lxx=eng` (Göttingen keeps ESV 2:28–32 in ch2 and ESV ch3 as ch3; MT uses 3:1–5 / ch4).
  - **Micah** — `lxx=eng`; Göttingen 5:1 = ESV 5:1 (the file previously mapped it to 4:14).
  - **Malachi** — `lxx=eng` with sequential `mt` 3:19–24; dropped the Rahlfs verse reorder (Göttingen ch4 is sequential).

### Added

- **Zephaniah** and **Haggai** versification files (new). Göttingen moves ESV/MT 2:15→3:1 (Zephaniah) and 1:15→2:1 (Haggai), each merging into the following verse.

## 0.5.1 — 2026-05-25

### Fixed

- **Zechariah LXX versification used Rahlfs instead of Göttingen.** The app reads Zechariah from the Göttingen edition (Duodecim Prophetae XIII), where Zechariah is numbered the same as English — the lead verse number is Göttingen and the parenthetical is Rahlfs (e.g. `(14)10 τέρπου καὶ εὐφραίνου, θύγατερ Σιων` = Göttingen 2:10 / Rahlfs 2:14). The data wrongly set `lxx` equal to the MT/Rahlfs number, so `Zechariah 2:10 ENG` reported `lxx: "2:14"` and parsing the Göttingen reference `2:10` as LXX back-mapped to `eng: "2:6"`. `lxx` now equals the Göttingen (= English) number for all 1:18–2:13 entries; `mt` is unchanged.

## 0.4.1 — 2026-04-28

### Fixed

- **Genesis 5:32 LXX missing entry.** ENG/MT Gen 5:32 ("Noah was 500 years old, and he fathered Shem, Ham, and Japheth") is folded into LXX Göttingen Gen 6:1, so LXX Genesis 5 has only 31 verses. The previous data left ENG Gen 5:32 unmapped, so `convertVersion("lxx")` returned 32 verses for Gen 5 and downstream lookups against an LXX corpus 404'd. Now correctly emits `missingPassages: [{ verse: 32 }]` and `verses: ["1-31"]`.

## 0.4.0 — 2026-04-28

LXX versification audit + structural fixes. Major data-correctness pass against authoritative sources (Hanhart's Göttingen Esther, Rahlfs-Hanhart 2006, Göttingen Theodotion Daniel/Susanna/Bel) verified via Logos library.

### Added

- `parser.edition("rahlfs" | "auto")` — selects LXX edition. Default `"auto"` uses Göttingen where attested per `src/data/lxx-editions.js` and Rahlfs elsewhere.
- `passage.convertVersion(target, { edition })` — per-call edition override.
- `passage.getLXXRahlfs()` helper.
- `ReferenceParser.expandVersificationValue(value)` — parses `"ch:v"`, `"ch:v1-v2"`, `"ch:v[a-z]"`, returns empty array for malformed/empty input. Handles all shapes used in the data files without producing NaN.
- `verseSuffix` propagated through `scripture.cv`, `verses[]`, `to.verses[]`, `original`, and `abbr` so converting `Esther 11:2 ENG → LXX` outputs `Esther 1:1a` (was previously losing the letter suffix).
- `cloned.missingPassages` array on conversions when verses don't exist in the target version (e.g., 1 Kgs 4:21 LXX="").
- `src/data/lxx-editions.js` — registry of which OT books are in Göttingen vs. Rahlfs-only. Update as new Göttingen volumes ship.
- New versification files: `2kings.js` (ENG 11:21 = MT/LXX 12:1; ENG 12:1-21 = MT/LXX 12:2-22), `esther.js` (Hanhart-verified Vulgate ↔ Rahlfs letter-suffix mapping for Additions A-F).
- New `chapter_verses` extensions: Daniel 13 (Susanna, 64 v) + 14 (Bel, 42 v); Esther 10 extended through 16 for Vulgate/RSV-Apocrypha numbering of additions.
- `Song of Solomon` registered as an alias of `Song of Songs` in `versified.js`.

### Fixed

- **MT-side versification bugs (116 entries):** entries that incorrectly left `mt = eng` when MT actually shifts. Verified by cross-checking against BHS in MongoDB.
  - `Genesis 31:55-32:32` (33 entries): ENG 31:55 = MT 32:1, ENG 32:N = MT 32:N+1
  - `1 Samuel 23:29` (1 entry): ENG 23:29 = MT 24:1
  - `2 Samuel 18:33-19:43` (44 entries): ENG 18:33 = MT 19:1, ENG 19:N = MT 19:N+1
  - `Psalms 92:0` (1 entry): ENG title = MT 92:1
  - `Ezekiel 20:45-49` (5 entries): ENG 20:N = MT 21:N-44
  - `Ezekiel 21:1-32` (32 entries): ENG 21:N = MT 21:N+5
- `numbers.js`: replaced corrupted final entry (`29:40 → lxx:"26:48"`); added Num 30:1-16 ENG = MT/LXX 30:2-17.
- `micah.js`: full rewrite. Was off by one on MT and unshifted on LXX. ENG 5:1 = MT/LXX 4:14, ENG 5:2-15 = MT/LXX 5:1-14.
- `psalms.js`: fixed Ps 147:10-20 boundary. Was at 9/10; correct boundary is at 11/12 (ENG 147:1-11 = LXX 146:1-11; ENG 147:12-20 = LXX 147:1-9).
- `genesis.js`: removed no-op `35:16` entry; corrected `35:21` to `lxx: ""` (verse missing in LXX).
- `expandVersificationValue` correctly handles range strings (e.g., Gen 31:48 LXX `"31:47-48"`) by emitting one sub-passage per verse.

### Tests

- 77 assertion-based tests in `tests/lxx-versification-audit.test.js` covering `expandVersificationValue`, all the fixed entries, suffix preservation, edition switching, and the MT-side fixes. All passing.

## 0.3.0 — 2026-01-10

- Added `convertVersion(targetVersion)` method on passage objects for versification conversion.
- Accepts version string: `"eng"`, `"lxx"`, `"mt"`, or `"bhs"` (alias for MT).
- Automatically converts chapter/verse references between versifications when versification data exists.
- Returns same reference with updated version metadata if no versification exists.
- Tested with Psalms, Zechariah, and NT passages.
- Published to npm as `codexparser@0.3.0`.

See the release: https://github.com/jeremyam/CodexParser/releases/tag/v0.3.0

## 0.2.0 — 2026-01-10

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

See the release: https://github.com/jeremyam/CodexParser/releases/tag/v0.2.0
