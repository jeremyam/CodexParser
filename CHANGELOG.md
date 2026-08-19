# Changelog

All notable changes to this project are documented here. For full details, see the Release Notes in README and the GitHub Releases page.

## 0.6.4 — 2026-08-19

### Fixed

- **Jeremiah MT→LXX table aligned with the Göttingen (Ziegler) numbering across the oracles-against-the-nations block.** Several ranges followed Swete's or Rahlfs' arrangements instead, sending consumers to wrong-chapter or wrong-verse Greek:
  - MT 49:1-5 (Ammon) → 30:1-5 (was Swete's 30:17-21); MT 49:7-22 (Edom) → 29:8-23 (was 30:1-16, which is Ammon/Kedar/Damascus in Ziegler); MT 49:23-27 (Damascus) → 30:12-16 (was unmapped); MT 49:28-33 (Kedar) → 30:6-11 (was a typo'd 20:23-28). MT 49:6 keeps the 30:22 sentinel for its θ′ supplement (Ziegler leaves it unnumbered between 30:5 and 30:6).
  - MT 25:15-38 (cup of wrath) → 32:1-24 (was Rahlfs' MT-keeping 32:15-38 — off by 14 against Ziegler's continuous renumbering).
  - MT 27 → ch 34 per-verse map (Ziegler renumbers continuously 1-18; the old uniform 27:v→34:v was off by one for the whole chapter). The five OG-minus verses (27:1, 7, 13, 17, 21) park at unoccupied sentinels 34:19-23.
  - MT 34 → ch 41 (was ch 44, colliding with MT 37 — served the wrong chapter's text); MT 42 → ch 49 (was ch 48, colliding with MT 41).
  - MT 46:1 (OG-minus superscription) → sentinel 26:29 (26:1 is the Elam superscription, not MT 46:1).
- Removed literal duplicate entries for 36:1, 38:1, and 49:36.

## 0.6.3 — 2026-08-19

### Fixed

- **Remaining Old Greek minuses in renumbered Jeremiah chapters now map to their hexaplaric LXX positions:** MT 39:4-13 → LXX 46:4-13, MT 48:45-47 → LXX 31:45-47, MT 49:6 → LXX 30:22. Same defect class as 0.6.2's Jeremiah 33:14-26 fix: these verses are absent from the OG, and the unmapped references passed through `convertVersion("lxx")` unchanged — but their MT chapter numbers point at *different* LXX chapters (LXX 39 = MT 32, LXX 48 = MT 41, LXX 49 = MT 42), so consumers fetched wrong-chapter text. Every known OG minus in Jeremiah now either maps to its true LXX coordinates or already shares its chapter number with the LXX.

## 0.6.2 — 2026-08-19

### Fixed

- **Jeremiah MT 33:14-26 now maps to LXX 40:14-26.** The Old Greek lacks these verses (Ziegler's Göttingen main text of ch. 40 ends at v. 13; vv. 14-26 survive only as the Theodotion supplement printed sub ※ in the apparatus), so the versification table stopped at 33:13. But an unmapped reference passed through `convertVersion("lxx")` unchanged, and LXX "Jeremiah 33:15" is a *different verse* (MT 26:15) — consumers querying an LXX-numbered text store silently fetched the wrong passage. The verses now carry the hexaplaric 40:14-26 numbering so lookups land where any Greek text for them (θ′) actually lives.

## 0.6.1 — 2026-08-15

### Fixed

- **`require("codexparser/package.json")` threw `ERR_PACKAGE_PATH_NOT_EXPORTED`.** The `exports` map added in 0.6.0 declared only the `"."` entry, which turns off every other subpath — including the `package.json` that consumers read to log or assert the installed version (a working import in 0.5.8 and earlier). The map now also exposes `"./package.json": "./package.json"`, the conventional escape hatch. No other subpaths are exported; internal `src/` modules remain private.

## 0.6.0 — 2026-08-15

### Added

- **Deuterocanonical books.** Tobit, Judith, Wisdom of Solomon, Sirach, Baruch, Epistle of Jeremiah, 1 Esdras, 1–4 Maccabees, and Prayer of Manasseh now parse, validate, abbreviate (SBL style: `Sir. 24:1 LXX`), and format as OSIS (`Sir.24.1`). Common abbreviations are recognized (`Sir`, `Ecclus`, `Tob`, `Jdt`, `Wis`, `Bar`, `Ep Jer`, `1 Esd`, `1 Macc` … `4 Macc`, `Pr Man`). Chapter/verse counts follow the SWORD Project's LXX versification tables (Rahlfs-based; a compromise system, so a few chapter maxima are permissive across editions). Numeric OSIS ids place them after the protestant canon (Tobit = 67 …) so books 1–66 keep their stable numbers. Epistle of Jeremiah and Prayer of Manasseh behave as single-chapter books (`Ep Jer 5` → `EpJer.1.5`). These books report `testament: "old"` and default to the LXX version when parsed with `bibleVersion("lxx")`; no ENG/MT versification mappings ship yet.
- **TypeScript definitions** (`index.d.ts`) covering `CodexParser`, the passage object, `PassageCollection`, validation results, and version helpers.
- **ESM entry point** (`index.mjs`) with a proper `exports` map — `import CodexParser from "codexparser"` now works alongside `require`.
- **Dual CJS export.** `require("codexparser")` returns the class directly again (as the README always showed), while `require("codexparser").CodexParser` keeps working.
- **CI.** GitHub Actions workflow running the test suite on Node 18/20/22/24, plus a `.prettierrc` codifying the existing style.

### Fixed

- **`replace()` injected stray spaces** (`"See John 3:16."` became `"See John 3:16 ."`). It is now index-based using the scanner's exact `startIndex`/`endIndex` spans, with a literal-text fallback when the input differs from the scanned text. Chapter-switching comma lists replace their shared span once, joined with `"; "`.
- **"Song of Solomon" references were flagged invalid** (chapter data was only registered under "Song of Songs").
- **Combined multi-chapter hashes dropped the final comma verse.** `combine({ book: true, chapter: false })` over `Matt 1:1-5; 12:16,19` produced `Matt.1.1-Matt.12.16`; the OSIS end verse now uses the last verse entry (`Matt.1.1-Matt.12.19`).
- **`combine()` of a single range passage was typed `chapter_verse`** instead of `chapter_verse_range`.
- **Converted passages lost their helper methods**, so `p.getLXX().getEnglish()` threw. Version helpers are re-attached to every conversion result.
- **`Ez` abbreviation resolves to Ezra again** (`Ezek`/`Eze` still win for Ezekiel via longest-match).

### Changed

- **Tests.** The ~20 ad-hoc scripts in `tests/` were converted into proper `node:test` suites (60 tests) covering collections, conversions, scanning/replacement, parsing, and the LXX versification audit; `npm test` now runs everything.
- **Book regexes are generated from the canonical data** in `bible.js`/`abbr.js` instead of a hand-maintained alternation (legacy `bookRegex`/`scripturesRegex` exports preserved).
- **Packaging metadata:** `repository`, `keywords`, `engines`, `types`, and `exports` added; stale release-notes files removed from the package (`CHANGELOG.md` is the single history); dead local-only scripts (`src/data/toc.js`, `src/data/esv.js`, `passage-generator.js`) moved out of the published tree — `toc.js` read a JSON file that was never shipped and would have crashed if required from the package.
- **`bibles/` is no longer tracked in git** (17 MB of local audit data; the files remain on disk and are gitignored).

## 0.5.8 — 2026-08-14

### Fixed

- **Proverbs LXX mapping pointed MT 20:20–22 at a nonexistent verse and missed the ch. 15/16 seam.** The app stores Rahlfs for Proverbs (no Göttingen edition) with Rahlfs' lettered verses merged into their base verse. MT 20:20–22 = Rahlfs 20:9a–c, so `lxx` is now `20:9` for all three (was `20:20`, which the LXX text doesn't have — Rahlfs ch. 20 runs 1–13, 23–30 by number). Added the ch. 15/16 seam, where an unmapped lookup silently returned the wrong verse because LXX-only pluses occupy 16:7–9: MT 16:6–9 = Rahlfs 15:27a/28a/29a/29b → `15:27`/`15:28`/`15:29`/`15:29`, and MT 16:4 = the plus numbered LXX 16:9. Genuine LXX omissions (4:7; 8:33; 11:4; 15:31; 16:1, 3; 18:23–24; 19:1–2; 20:14–19; 21:5; 22:6; 23:23) remain unmapped by design. All `mt` values unchanged (Proverbs MT numbering = English).

## 0.5.7 — 2026-08-11

### Fixed

- **Ezekiel 20:45–49 / 21:1–32 LXX mapping used Rahlfs numbers, not Göttingen.** The `lxx` values carried the Rahlfs/MT-style chapter division (ENG 20:45 → 21:1 … ENG 21:32 → 21:37), but Ziegler's Göttingen Ezechiel (XVI,1) divides chapters 20/21 the English way — his ch. 20 runs 1–49 (Teman/Negeb oracle stays in ch. 20) and ch. 21 runs 1–32 (apparatus: the 21:2 lemma is the Jerusalem oracle and the last entry is 21:32 λελάληκα). Fetching LXX text for ENG Ezek 21 verses therefore looked up verses 5 higher than the edition has (e.g. ENG 21:31 → 21:36, which doesn't exist in the Göttingen chapter) and returned nothing or the wrong verse. `lxx` is now identity with `eng` for 20:45–49 and 21:1–32. All `mt` values and the ch. 7 LXX verse-order mapping are unchanged.

## 0.5.6 — 2026-08-10

### Fixed

- **Malachi 4:4–6 LXX mapping ignored the Göttingen verse reorder.** 0.5.2 set `lxx = eng` for Malachi 4, reading the edition's sequential parenthetical numbers ((19)1 … (24)6) as proof of MT order — but those are positional, not verse identities. The Göttingen text (Duodecim Prophetae XIII) follows the LXX manuscript tradition and places "Remember the law of Moses" (MT 3:22 / ESV 4:4) **last**. Matching content: Göttingen 4:4 = ESV 4:5 (Elijah), 4:5 = ESV 4:6, 4:6 = ESV 4:4. `lxx` now carries those identity-correct numbers, so fetching ESV 4:5–6 returns the Elijah/restore verses instead of a one-verse shift. 4:1–3 and all `mt` values unchanged.

## 0.5.5 — 2026-06-26

### Fixed

- **Single-chapter books with a bare verse number were mis-parsed as a chapter.** `Jude 4`, `Philemon 6`, `Obadiah 15`, `2 John 7`, and `3 John 4` treated the number as a *chapter* (chapter 4, 6, 15, …) and were flagged invalid (code 102, "Chapter N does not exist"), instead of resolving to verse N of the book's single chapter. The bare number routed through `#handleEmptyReference` (chapter semantics) before reaching `#parseSingleChapterBook`, which already handled it correctly. `ReferenceParser.parse` now detects single-chapter books and routes their bare-number references to the single-chapter path, so `Jude 4` → `Jude 1:4` (`Jude.1.4`, valid). Unchanged: bare `1` still means the whole book (`Jude 1` → `Jude.1.1-Jude.1.25`), explicit `chapter:verse` (`Jude 1:4`), ranges (`Jude 4-7`), comma lists (`Jude 1,3,5`), and genuine out-of-range verses (`Obadiah 22` → invalid, code 104).

## 0.5.4 — 2026-06-25

### Fixed

- **Comma references that switch chapters were forced into the first chapter.** A reference such as `Daniel 8:16-18,9:21,23,10:8-10` was parsed as a single passage that collapsed every segment onto chapter 8, so `9:21,23` and `10:8-10` were lost. `ReferenceParser.parse` now pre-splits a comma list by chapter group (`#splitChapterSwitchingRefs` / `#chapterGroups`), emitting one passage per chapter — `Daniel 8:16-18` (range), `Daniel 9:21,23` (comma list), and `Daniel 10:8-10` (range) — each re-typed by the normal single-chapter path. Single-chapter comma lists (`9:21,23`), bare-verse lists (`1:1,2,3`), and a leading bare verse are unchanged; the split only triggers when the list actually crosses chapters (two or more chapter groups).

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
