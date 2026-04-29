# CodexParser 0.4.0

LXX versification audit + structural fixes. Major data-correctness pass against authoritative sources (Hanhart's Göttingen Esther 1983, Rahlfs-Hanhart 2006, Göttingen Theodotion Susanna/Daniel/Bel 1999) verified against a Logos library extract.

## Highlights

- **Göttingen vs. Rahlfs editions are now selectable.** Default is "auto" (Göttingen where attested, Rahlfs elsewhere); call `parser.edition("rahlfs")` to force Rahlfs everywhere, or pass `{ edition: "rahlfs" }` to `convertVersion`.
- **Esther's Greek additions A–F now round-trip cleanly.** ENG `Esther 11:2` → LXX `Esther 1:1a` (with `verseSuffix: "a"` carried through `scripture.cv`, `verses[]`, `original`, and `abbr`).
- **Daniel 13 (Susanna) and 14 (Bel & the Dragon) added** to `chapter_verses` and `versifications/daniel.js` (Theodotion).
- **Letter-suffixed verses no longer produce NaN** in `convertVersion`. The previously-broken cases (Gen 31:48 LXX `"31:47-48"`, 1 Kgs 4:21 LXX `""`, Isa 64:1 MT `"63:19b"`, Dan 3:24a) all parse correctly via the new `ReferenceParser.expandVersificationValue()` helper.
- **116 MT-side versification bugs fixed** across Genesis, 1 Samuel, 2 Samuel, Psalms, and Ezekiel — entries that incorrectly left `mt = eng` when MT actually shifts. Cross-verified against BHS data.
- **Ps 147 boundary fixed** at 11/12 (was 9/10): ENG 147:1-11 = LXX 146:1-11; ENG 147:12-20 = LXX 147:1-9.
- **Micah versification rewritten** (was off by one on MT and unshifted on LXX): ENG 5:1 = MT/LXX 4:14, ENG 5:2-15 = MT/LXX 5:1-14.

## What's new in the API

```javascript
const CodexParser = require("codexparser")

// 1. Edition selection
const parser = new CodexParser().edition("rahlfs")           // force Rahlfs
const auto   = new CodexParser()                              // auto (default)

// 2. Per-call edition override
const [p] = parser.parse("Genesis 31:55").getPassages()
const lxxR = p.convertVersion("lxx", { edition: "rahlfs" })
const lxxR2 = p.getLXXRahlfs()                                // helper

// 3. Esther additions with letter suffix
const [e] = parser.parse("Esther 11:2").getPassages()        // Add A
const lxx = e.convertVersion("lxx")
console.log(lxx.scripture.cv)                                 // "1:1a"
console.log(lxx.passages[0].verseSuffix)                      // "a"

// 4. Daniel 13 (Susanna) parses canonically
const [s] = parser.parse("Daniel 13:1").getPassages()         // valid: true
const mt  = s.convertVersion("mt")                            // missingPassages: chapter LXX-only

// 5. Range/letter values handled cleanly
const [g] = parser.parse("Genesis 31:48").getPassages()
const gLxx = g.convertVersion("lxx")
console.log(gLxx.scripture.cv)                                // "31:47-48"
```

## What got fixed in the data

### MT-side bugs (116 entries)

Each of these entries previously had `mt: "<ENG-key>"` (treating MT = ENG) when MT actually has an offset. Verified by checking against BHS texts.

| Book | Range | Pattern |
|------|-------|---------|
| Genesis | 31:55-32:32 | ENG 31:55 = MT 32:1; ENG 32:N = MT 32:N+1 |
| 1 Samuel | 23:29 | ENG 23:29 = MT 24:1 |
| 2 Samuel | 18:33-19:43 | ENG 18:33 = MT 19:1; ENG 19:N = MT 19:N+1 |
| Psalms | 92:0 | ENG title = MT 92:1 |
| Ezekiel | 20:45-49 | ENG 20:N = MT 21:N-44 |
| Ezekiel | 21:1-32 | ENG 21:N = MT 21:N+5 |

### Other corrections

- `numbers.js`: replaced corrupted final entry; added Num 30:1-16 ENG = MT/LXX 30:2-17.
- `micah.js`: full rewrite (every entry was wrong).
- `psalms.js`: fixed Ps 147 boundary 9/10 → 11/12.
- `genesis.js`: removed no-op `35:16` entry; corrected `35:21` to `lxx: ""` (verse missing in LXX).

## New data files

- `src/data/lxx-editions.js` — registry mapping each OT book to its current Göttingen attestation (`"gottingen"` or `"rahlfs"`). Update as new Göttingen volumes ship.
- `src/data/versifications/2kings.js` — ENG 11:21 = MT/LXX 12:1; ENG 12:1-21 = MT/LXX 12:2-22.
- `src/data/versifications/esther.js` — Hanhart-verified Vulgate ↔ Rahlfs letter-suffix mapping for Additions A–F.
- `src/data/chapter_verses/daniel.js` extended with Susanna (ch 13, 64 v) and Bel & Dragon (ch 14, 42 v).
- `src/data/chapter_verses/esther.js` extended through chapter 16 (Vulgate / RSV-Apocrypha layout).
- `Song of Solomon` registered as an alias of `Song of Songs` in `versified.js`.

## New return-shape fields

- **`passage.passages[i].verseSuffix`** — letter suffix when present (`"a"`, `"s"`, `"ee"`, etc.).
- **`passage.edition`** — `"auto"` or `"rahlfs"`, the resolved edition for this passage.
- **`cloned.missingPassages`** — array of sub-passages that don't exist in the conversion target (e.g., 1 Kgs 4:21 LXX, Daniel 13 in MT).

## Tests

77 assertion-based tests in `tests/lxx-versification-audit.test.js` covering `expandVersificationValue`, every fixed entry, suffix preservation, edition switching, and the MT-side fixes. All passing. Run with:

```bash
node tests/lxx-versification-audit.test.js
```

## Breaking changes

- `convertVersion` now returns `cloned.missingPassages` for verses that don't exist in the target version, where previously those would surface as NaN-valued `chapter`/`verse`. Callers that relied on NaN will need to handle the new `missingPassages` array instead.

See full CHANGELOG: https://github.com/jeremyam/CodexParser/blob/main/CHANGELOG.md
