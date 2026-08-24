// Assertion-based tests for the LXX versification audit fixes.
// Run with: node tests/lxx-versification-audit.test.js

const assert = require("node:assert/strict")
const CodexParser = require("../src/core/CodexParser.js")
const ReferenceParser = require("../src/core/ReferenceParser.js")
const versified = require("../src/data/versified.js")

let passed = 0
let failed = 0

function test(name, fn) {
    try {
        fn()
        passed++
        console.log(`  ok  ${name}`)
    } catch (err) {
        failed++
        console.log(`  FAIL ${name}`)
        console.log(`       ${err.message}`)
    }
}

function group(label, fn) {
    console.log(`\n${label}`)
    fn()
}

// --- expandVersificationValue (structural fix) ---

group("expandVersificationValue parses every shape used in data files", () => {
    const expand = ReferenceParser.expandVersificationValue

    test("plain ch:v", () => {
        assert.deepEqual(expand("31:47"), [{ chapter: 31, verse: 47 }])
    })

    test("range ch:v1-v2 expands to one entry per verse", () => {
        assert.deepEqual(expand("31:47-48"), [
            { chapter: 31, verse: 47 },
            { chapter: 31, verse: 48 },
        ])
    })

    test("letter suffix retains numeric verse and exposes suffix", () => {
        assert.deepEqual(expand("63:19b"), [{ chapter: 63, verse: 19, suffix: "b" }])
        assert.deepEqual(expand("3:24a"), [{ chapter: 3, verse: 24, suffix: "a" }])
    })

    test("empty string returns empty array (no NaN)", () => {
        assert.deepEqual(expand(""), [])
    })

    test("malformed input returns empty array (no NaN)", () => {
        assert.deepEqual(expand("not-a-ref"), [])
        assert.deepEqual(expand("47"), [])
        assert.deepEqual(expand(null), [])
        assert.deepEqual(expand(undefined), [])
    })
})

// --- convertVersion no longer produces NaN for tricky values ---

group("convertVersion handles range/empty/letter values without NaN", () => {
    const parser = new CodexParser()

    test("Genesis 31:48 ENG -> LXX expands range to two verses", () => {
        const [p] = parser.parse("Genesis 31:48").getPassages()
        const lxx = p.convertVersion("lxx")
        const verses = lxx.passages.map((s) => `${s.chapter}:${s.verse}`)
        assert.ok(verses.includes("31:47"), `expected 31:47 in ${verses}`)
        assert.ok(verses.includes("31:48"), `expected 31:48 in ${verses}`)
        lxx.passages.forEach((s) => {
            assert.ok(Number.isFinite(s.chapter) && Number.isFinite(s.verse), "no NaN")
        })
    })

    test("1 Kings 4:21 ENG -> LXX is recorded as missing in target", () => {
        const [p] = parser.parse("1 Kings 4:21").getPassages()
        const lxx = p.convertVersion("lxx")
        // 4:21 has lxx: "" so the verse should not appear in cloned.passages
        assert.equal(lxx.passages.length, 0)
        assert.ok(Array.isArray(lxx.missingPassages))
        assert.equal(lxx.missingPassages.length, 1)
        assert.equal(lxx.missingPassages[0].missingIn, "lxx")
    })

    test("Isaiah 64:1 ENG -> MT keeps verse=19 with suffix='b'", () => {
        const [p] = parser.parse("Isaiah 64:1").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.passages.length, 1)
        assert.equal(mt.passages[0].chapter, 63)
        assert.equal(mt.passages[0].verse, 19)
        assert.equal(mt.passages[0].verseSuffix, "b")
    })
})

// --- Song of Solomon alias ---

group("Song of Solomon resolves to the same data as Song of Songs", () => {
    test("both book names are registered", () => {
        assert.ok(versified["Song of Songs"])
        assert.ok(versified["Song of Solomon"])
        assert.equal(versified["Song of Songs"], versified["Song of Solomon"])
    })

    test("Song of Solomon 7:1 -> LXX 7:2 via convertVersion", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("Song of Solomon 7:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 7)
        assert.equal(lxx.passages[0].verse, 2)
    })
})

// --- 2 Kings ---

group("2 Kings versification (newly added)", () => {
    test("2 Kings 11:21 ENG -> 12:1 in MT and LXX", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("2 Kings 11:21").getPassages()
        const lxx = p.convertVersion("lxx")
        const mt = p.convertVersion("mt")
        assert.equal(lxx.passages[0].chapter, 12)
        assert.equal(lxx.passages[0].verse, 1)
        assert.equal(mt.passages[0].chapter, 12)
        assert.equal(mt.passages[0].verse, 1)
    })

    test("2 Kings 12:1 ENG -> 12:2 in MT and LXX", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("2 Kings 12:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 12)
        assert.equal(lxx.passages[0].verse, 2)
    })
})

// --- Numbers chapter 30 fix ---

group("Numbers 29:40-30:16 versification (post-fix)", () => {
    const parser = new CodexParser()

    test("Numbers 29:40 ENG -> MT/LXX 30:1", () => {
        const [p] = parser.parse("Numbers 29:40").getPassages()
        const mt = p.convertVersion("mt")
        const lxx = p.convertVersion("lxx")
        assert.equal(mt.passages[0].chapter, 30)
        assert.equal(mt.passages[0].verse, 1)
        assert.equal(lxx.passages[0].chapter, 30)
        assert.equal(lxx.passages[0].verse, 1)
    })

    test("Numbers 30:1 ENG -> MT/LXX 30:2", () => {
        const [p] = parser.parse("Numbers 30:1").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.passages[0].chapter, 30)
        assert.equal(mt.passages[0].verse, 2)
    })

    test("Numbers 30:16 ENG -> MT/LXX 30:17", () => {
        const [p] = parser.parse("Numbers 30:16").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 30)
        assert.equal(lxx.passages[0].verse, 17)
    })
})

// --- Micah rewrite ---

group("Micah versification (post-rewrite)", () => {
    const parser = new CodexParser()

    test("Micah 5:1 ENG -> MT 4:14, LXX 5:1 (Göttingen numbers like English)", () => {
        const [p] = parser.parse("Micah 5:1").getPassages()
        const mt = p.convertVersion("mt")
        const lxx = p.convertVersion("lxx")
        assert.equal(mt.passages[0].chapter, 4)
        assert.equal(mt.passages[0].verse, 14)
        assert.equal(lxx.passages[0].chapter, 5)
        assert.equal(lxx.passages[0].verse, 1)
    })

    test("Micah 5:2 ENG -> MT 5:1, LXX 5:2 (Bethlehem prophecy)", () => {
        const [p] = parser.parse("Micah 5:2").getPassages()
        const mt = p.convertVersion("mt")
        const lxx = p.convertVersion("lxx")
        assert.equal(mt.passages[0].chapter, 5)
        assert.equal(mt.passages[0].verse, 1)
        assert.equal(lxx.passages[0].chapter, 5)
        assert.equal(lxx.passages[0].verse, 2)
    })

    test("Micah 5:15 ENG -> MT/LXX 5:14", () => {
        const [p] = parser.parse("Micah 5:15").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.passages[0].chapter, 5)
        assert.equal(mt.passages[0].verse, 14)
    })
})

// --- Psalm 147 boundary ---

group("Psalm 147 boundary is at 11/12 (post-fix)", () => {
    const parser = new CodexParser()

    test("Ps 147:11 ENG -> LXX 146:11 (still inside LXX Ps 146)", () => {
        const [p] = parser.parse("Psalm 147:11").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 146)
        assert.equal(lxx.passages[0].verse, 11)
    })

    test("Ps 147:12 ENG -> LXX 147:1 (start of LXX Ps 147)", () => {
        const [p] = parser.parse("Psalm 147:12").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 147)
        assert.equal(lxx.passages[0].verse, 1)
    })

    test("Ps 147:20 ENG -> LXX 147:9 (last verse)", () => {
        const [p] = parser.parse("Psalm 147:20").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 147)
        assert.equal(lxx.passages[0].verse, 9)
    })
})

// --- Genesis 35 cleanup ---

group("Genesis 35:21-22 (post-cleanup)", () => {
    test("35:16 entry removed (was a self-mapping no-op)", () => {
        assert.equal(versified.Genesis["35:16"], undefined)
    })

    test("35:21 ENG marked as missing in LXX, retained in MT", () => {
        const entry = versified.Genesis["35:21"]
        assert.ok(entry)
        assert.equal(entry.lxx, "")
        assert.equal(entry.mt, "35:21")
    })

    test("35:22 ENG -> LXX 35:21", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("Genesis 35:22").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 35)
        assert.equal(lxx.passages[0].verse, 21)
    })
})

// --- Existing well-known mappings still work (regression guards) ---

group("Existing mappings still work", () => {
    const parser = new CodexParser()

    test("Genesis 31:55 ENG -> LXX 32:1", () => {
        const [p] = parser.parse("Genesis 31:55").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 32)
        assert.equal(lxx.passages[0].verse, 1)
    })

    test("Joel 2:28 ENG -> MT 3:1, LXX 2:28 (Göttingen numbers like English)", () => {
        const [p] = parser.parse("Joel 2:28").getPassages()
        const mt = p.convertVersion("mt")
        const lxx = p.convertVersion("lxx")
        assert.equal(mt.passages[0].chapter, 3)
        assert.equal(mt.passages[0].verse, 1)
        assert.equal(lxx.passages[0].chapter, 2)
        assert.equal(lxx.passages[0].verse, 28)
    })

    test("Jeremiah 51:1 ENG -> LXX 28:1", () => {
        const [p] = parser.parse("Jeremiah 51:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 28)
        assert.equal(lxx.passages[0].verse, 1)
    })

    test("John 3:16 with no versification round-trips unchanged", () => {
        const [p] = parser.parse("John 3:16").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.hash, p.scripture.hash)
    })
})

// --- verseSuffix is preserved in scripture.cv ---

group("verseSuffix flows through to scripture.cv", () => {
    test("Isaiah 64:1 ENG -> MT outputs '63:19b'", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("Isaiah 64:1").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "63:19b")
        assert.equal(mt.verses[0], "19b")
    })

    test("Genesis 31:48 ENG -> LXX range outputs '31:47-48'", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("Genesis 31:48").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "31:47-48")
    })
})

// --- Daniel 13/14 (Susanna, Bel) ---

group("Daniel 13 (Susanna) and 14 (Bel & Dragon)", () => {
    const parser = new CodexParser()

    test("Daniel 13:1 parses and validates", () => {
        const [p] = parser.parse("Daniel 13:1").getPassages()
        assert.equal(p.valid, true)
        assert.equal(p.book, "Daniel")
        assert.equal(p.chapter, 13)
    })

    test("Daniel 13:64 (last verse of Susanna) parses and validates", () => {
        const [p] = parser.parse("Daniel 13:64").getPassages()
        assert.equal(p.valid, true)
        assert.equal(p.passages[0].verse, 64)
    })

    test("Daniel 14:42 (last verse of Bel) parses and validates", () => {
        const [p] = parser.parse("Daniel 14:42").getPassages()
        assert.equal(p.valid, true)
    })

    test("Daniel 13:1 -> LXX 13:1 (Theodotion shares numbering)", () => {
        const [p] = parser.parse("Daniel 13:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 13)
        assert.equal(lxx.passages[0].verse, 1)
    })

    test("Daniel 13:1 -> MT is recorded as missing (chapter not in Hebrew)", () => {
        const [p] = parser.parse("Daniel 13:1").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.passages.length, 0)
        assert.ok(Array.isArray(mt.missingPassages))
        assert.equal(mt.missingPassages[0].missingIn, "mt")
    })
})

// --- Daniel 5:31/6 — Göttingen numbers these the English way (0.6.6) ---

group("Daniel 5:31 and chapter 6 LXX follow the Göttingen (English-style) numbering", () => {
    const parser = new CodexParser()

    test("Daniel 5:31 -> LXX 5:31 (Darius the Mede), MT 6:1", () => {
        const [p] = parser.parse("Daniel 5:31").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 5)
        assert.equal(lxx.passages[0].verse, 31)
        const mt = p.convertVersion("mt")
        assert.equal(mt.passages[0].chapter, 6)
        assert.equal(mt.passages[0].verse, 1)
    })

    test("Daniel 6:22 -> LXX 6:22 (angel shut the lions' mouths), MT 6:23", () => {
        const [p] = parser.parse("Daniel 6:22").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].verse, 22)
        const mt = p.convertVersion("mt")
        assert.equal(mt.passages[0].verse, 23)
    })

    test("Daniel 6:28 (last verse) -> LXX 6:28, MT 6:29", () => {
        const [p] = parser.parse("Daniel 6:28").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].verse, 28)
        const mt = p.convertVersion("mt")
        assert.equal(mt.passages[0].verse, 29)
    })
})

// --- Esther additions A-F ---

group("Esther additions parse and convert", () => {
    const parser = new CodexParser()

    test("Esther 11:2 parses and validates (Addition A)", () => {
        const [p] = parser.parse("Esther 11:2").getPassages()
        assert.equal(p.valid, true)
        assert.equal(p.book, "Esther")
        assert.equal(p.chapter, 11)
        assert.equal(p.passages[0].verse, 2)
    })

    test("Esther 11:2 ENG -> LXX 1:1a (Addition A first verse)", () => {
        const [p] = parser.parse("Esther 11:2").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "1:1a")
        assert.equal(lxx.passages[0].chapter, 1)
        assert.equal(lxx.passages[0].verse, 1)
        assert.equal(lxx.passages[0].verseSuffix, "a")
    })

    test("Esther 13:1 ENG -> LXX 3:13a (Addition B first decree)", () => {
        const [p] = parser.parse("Esther 13:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "3:13a")
    })

    test("Esther 13:8 ENG -> LXX 4:17a (Addition C, Mordecai's prayer)", () => {
        const [p] = parser.parse("Esther 13:8").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "4:17a")
    })

    test("Esther 14:1 ENG -> LXX 4:17m (Addition C, Esther's prayer)", () => {
        const [p] = parser.parse("Esther 14:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "4:17m")
    })

    test("Esther 15:1 ENG -> LXX 5:1a (Addition D, approaches king)", () => {
        const [p] = parser.parse("Esther 15:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "5:1a")
    })

    test("Esther 16:1 ENG -> LXX 8:12a (Addition E, second decree)", () => {
        const [p] = parser.parse("Esther 16:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "8:12a")
    })

    test("Esther 16:21 ENG -> LXX 8:12x (Addition E, last distinct letter)", () => {
        // Hanhart's Add E runs 8:12a-12u, then jumps directly to 12x
        // (skipping v and w). Vulgate 16:1-21 fills the 21 letters; verses
        // 16:22-24 are surplus in Vulgate and collapse to 8:12x.
        const [p] = parser.parse("Esther 16:21").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "8:12x")
    })

    test("Esther 16:22-24 ENG collapse to LXX 8:12x (Vulgate exceeds Hanhart)", () => {
        const [p1] = parser.parse("Esther 16:22").getPassages()
        const [p2] = parser.parse("Esther 16:24").getPassages()
        assert.equal(p1.convertVersion("lxx").scripture.cv, "8:12x")
        assert.equal(p2.convertVersion("lxx").scripture.cv, "8:12x")
    })

    test("Esther 10:4 ENG -> LXX 10:3a (Addition F)", () => {
        const [p] = parser.parse("Esther 10:4").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "10:3a")
    })

    test("Esther 11:1 ENG -> LXX 10:3l (Addition F colophon)", () => {
        const [p] = parser.parse("Esther 11:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "10:3l")
    })

    test("Addition C: Vulgate split point 13:18 -> LXX 4:17l (Mordecai's prayer ends)", () => {
        const [p] = parser.parse("Esther 13:18").getPassages()
        assert.equal(p.convertVersion("lxx").scripture.cv, "4:17l")
    })

    test("Addition C: Vulgate 14:13 -> LXX 4:17z (last distinct Hanhart letter)", () => {
        // Hanhart Add C ends at 4:17z; Vulgate 14:14-19 collapse onto it.
        const [p] = parser.parse("Esther 14:13").getPassages()
        assert.equal(p.convertVersion("lxx").scripture.cv, "4:17z")
    })

    test("Addition D: Vulgate 15:6 -> LXX 5:1f, 15:7 -> 5:2a (anchor switch)", () => {
        const [a] = parser.parse("Esther 15:6").getPassages()
        const [b] = parser.parse("Esther 15:7").getPassages()
        assert.equal(a.convertVersion("lxx").scripture.cv, "5:1f")
        assert.equal(b.convertVersion("lxx").scripture.cv, "5:2a")
    })

    test("Addition D: Vulgate 15:9-16 collapse to LXX 5:2b (Vulgate exceeds Hanhart)", () => {
        const [a] = parser.parse("Esther 15:9").getPassages()
        const [b] = parser.parse("Esther 15:16").getPassages()
        assert.equal(a.convertVersion("lxx").scripture.cv, "5:2b")
        assert.equal(b.convertVersion("lxx").scripture.cv, "5:2b")
    })

    test("Esther additions are missing in MT (Hebrew text)", () => {
        const [p] = parser.parse("Esther 13:8").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.passages.length, 0)
        assert.equal(mt.missingPassages[0].missingIn, "mt")
    })

    test("Vulgate 1:1 -> LXX 1:1s (bridge verse after Addition A)", () => {
        // Hanhart's Göttingen Esther interpolates Add A (1:1a-1:1r) plus a
        // bridging recap (1:1s) before chapter 1 verse 2 begins. The canonical
        // "in the days of Ahasuerus" sentence sits at 1:1s in the Greek.
        const [p] = parser.parse("Esther 1:1").getPassages()
        const lxx = p.convertVersion("lxx")
        const mt = p.convertVersion("mt")
        assert.equal(lxx.scripture.cv, "1:1s")
        assert.equal(mt.scripture.cv, "1:1")
    })

    test("Hebrew Esther 1:2 has no versification offset (resolves identically)", () => {
        const [p] = parser.parse("Esther 1:2").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "1:2")
    })
})

// --- Edition switching ---

group("edition() option (Göttingen-default, Rahlfs override)", () => {
    test("default edition is 'auto'", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("Genesis 1:1").getPassages()
        assert.equal(p.edition, "auto")
    })

    test("parser.edition('rahlfs') propagates to parsed passages", () => {
        const parser = new CodexParser().edition("rahlfs")
        const [p] = parser.parse("Genesis 1:1").getPassages()
        assert.equal(p.edition, "rahlfs")
    })

    test("convertVersion accepts options.edition override", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("Esther 11:2").getPassages()
        // No lxxRahlfs override on Esther entries yet, so result should match default
        const lxxAuto = p.convertVersion("lxx")
        const lxxRahlfs = p.convertVersion("lxx", { edition: "rahlfs" })
        assert.equal(lxxAuto.scripture.cv, lxxRahlfs.scripture.cv)
    })

    test("getLXXRahlfs helper returns same as convertVersion('lxx', {edition:'rahlfs'})", () => {
        const parser = new CodexParser()
        const [p] = parser.parse("Genesis 31:55").getPassages()
        const a = p.convertVersion("lxx", { edition: "rahlfs" })
        const b = p.getLXXRahlfs()
        assert.equal(a.scripture.cv, b.scripture.cv)
    })

    test("invalid edition value normalizes to 'auto'", () => {
        const parser = new CodexParser().edition("nonsense")
        const [p] = parser.parse("Genesis 1:1").getPassages()
        assert.equal(p.edition, "auto")
    })

    test("lxxRahlfs override is consulted when edition is 'rahlfs'", () => {
        // Synthesize a passage and inject a versification record with both
        // lxx and lxxRahlfs to exercise the resolver.
        const parser = new CodexParser()
        const [p] = parser.parse("Genesis 31:55").getPassages()
        // Mutate in place - this is a test-only injection
        p.passages[0].versification = {
            lxx: "32:1",
            lxxRahlfs: "32:99",
            mt: "31:55",
            eng: "31:55",
        }
        const auto = p.convertVersion("lxx")
        const rahlfs = p.convertVersion("lxx", { edition: "rahlfs" })
        assert.equal(auto.passages[0].verse, 1)
        assert.equal(rahlfs.passages[0].verse, 99)
    })
})

// --- MT-side versification fixes (April 2026 audit) ---

group("MT-side versification correctly shifts when LXX shifts", () => {
    const parser = new CodexParser()

    test("Genesis 31:55 ENG -> MT 32:1 (was incorrectly mt=31:55)", () => {
        const [p] = parser.parse("Genesis 31:55").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "32:1")
    })

    test("Genesis 32:1 ENG -> MT 32:2 (whole chapter shifted by 1)", () => {
        const [p] = parser.parse("Genesis 32:1").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "32:2")
    })

    test("Genesis 32:32 ENG -> MT 32:33 (last verse)", () => {
        const [p] = parser.parse("Genesis 32:32").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "32:33")
    })

    test("1 Samuel 23:29 ENG -> MT 24:1", () => {
        const [p] = parser.parse("1 Samuel 23:29").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "24:1")
    })

    test("2 Samuel 18:33 ENG -> MT 19:1", () => {
        const [p] = parser.parse("2 Samuel 18:33").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "19:1")
    })

    test("2 Samuel 19:1 ENG -> MT 19:2", () => {
        const [p] = parser.parse("2 Samuel 19:1").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "19:2")
    })

    test("2 Samuel 19:43 ENG -> MT 19:44 (last verse of shifted chapter)", () => {
        const [p] = parser.parse("2 Samuel 19:43").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "19:44")
    })

    test("Psalms 92:0 (title) -> MT 92:1 (MT counts superscription as v1)", () => {
        const versified = require("../src/data/versified")
        assert.equal(versified.Psalms["92:0"].mt, "92:1")
    })

    test("Ezekiel 20:45 ENG -> MT 21:1 (chapter-end pulled into next ch)", () => {
        const [p] = parser.parse("Ezekiel 20:45").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "21:1")
    })

    test("Ezekiel 20:49 ENG -> MT 21:5", () => {
        const [p] = parser.parse("Ezekiel 20:49").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "21:5")
    })

    test("Ezekiel 21:1 ENG -> MT 21:6 (chapter shifted by 5)", () => {
        const [p] = parser.parse("Ezekiel 21:1").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "21:6")
    })

    test("Ezekiel 21:32 ENG -> MT 21:37 (last shifted verse)", () => {
        const [p] = parser.parse("Ezekiel 21:32").getPassages()
        const mt = p.convertVersion("mt")
        assert.equal(mt.scripture.cv, "21:37")
    })

    test("Ezekiel 20:45 ENG -> LXX 20:45 (Ziegler keeps English ch. division)", () => {
        const [p] = parser.parse("Ezekiel 20:45").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "20:45")
    })

    test("Ezekiel 21:26 ENG -> LXX 21:26 (identity, not Rahlfs 21:31)", () => {
        const [p] = parser.parse("Ezekiel 21:26").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "21:26")
    })

    test("Ezekiel 21:32 ENG -> LXX 21:32 (Ziegler ch. 21 ends at 32)", () => {
        const [p] = parser.parse("Ezekiel 21:32").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "21:32")
    })

    test("Ezekiel 7:6 ENG -> LXX 7:3 (ch. 7 LXX order unchanged)", () => {
        const [p] = parser.parse("Ezekiel 7:6").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "7:3")
    })

    test("Genesis 31:55 LXX still 32:1 (no regression)", () => {
        const [p] = parser.parse("Genesis 31:55").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.scripture.cv, "32:1")
    })
})

// --- Esther additions verseSuffix carry-through (post-mongo-reimport) ---

group("Esther addition verses produce verseSuffix on conversion", () => {
    const parser = new CodexParser()

    test("Esther 11:2 ENG -> LXX has verseSuffix='a'", () => {
        const [p] = parser.parse("Esther 11:2").getPassages()
        const lxx = p.convertVersion("lxx")
        const sub = lxx.passages[0]
        assert.equal(sub.chapter, 1)
        assert.equal(sub.verse, 1)
        assert.equal(sub.verseSuffix, "a")
    })

    test("Esther 13:8 ENG -> LXX 4:17a (Mordecai's prayer start)", () => {
        const [p] = parser.parse("Esther 13:8").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 4)
        assert.equal(lxx.passages[0].verse, 17)
        assert.equal(lxx.passages[0].verseSuffix, "a")
    })

    test("Esther 16:24 ENG -> LXX 8:12x (Add E last verse)", () => {
        const [p] = parser.parse("Esther 16:24").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 8)
        assert.equal(lxx.passages[0].verse, 12)
        assert.equal(lxx.passages[0].verseSuffix, "x")
    })

    test("Esther 1:1 ENG -> LXX 1:1s (bridge after Add A)", () => {
        const [p] = parser.parse("Esther 1:1").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 1)
        assert.equal(lxx.passages[0].verse, 1)
        assert.equal(lxx.passages[0].verseSuffix, "s")
    })

    test("Canonical Esther 1:2 has no verseSuffix on LXX conversion", () => {
        const [p] = parser.parse("Esther 1:2").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].verseSuffix, undefined)
    })
})

// --- Summary ---
console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed === 0 ? 0 : 1)

// --- Exodus 40 — Wevers renumbers the chapter 1-32 (0.6.7) ---

group("Exodus 40 LXX follows Wevers' continuous 1-32 numbering", () => {
    const parser = new CodexParser()

    test("Exodus 40:34 (cloud covered the tent) -> LXX 40:28", () => {
        const [p] = parser.parse("Exodus 40:34").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].chapter, 40)
        assert.equal(lxx.passages[0].verse, 28)
    })

    test("Exodus 40:38 (last verse) -> LXX 40:32", () => {
        const [p] = parser.parse("Exodus 40:38").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].verse, 32)
    })

    test("Exodus 40:17 -> LXX 40:15 (MT 40:7-8, 11 are LXX minuses)", () => {
        const [p] = parser.parse("Exodus 40:17").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages[0].verse, 15)
    })

    test("Exodus 40:7 is recorded as missing in the LXX", () => {
        const [p] = parser.parse("Exodus 40:7").getPassages()
        const lxx = p.convertVersion("lxx")
        assert.equal(lxx.passages.length, 0)
        assert.ok(Array.isArray(lxx.missingPassages) && lxx.missingPassages.length === 1)
    })

    test("Exodus 40:30-32 (laver washing) -> merged Wevers 38:27", () => {
        for (const v of [30, 31, 32]) {
            const [p] = parser.parse("Exodus 40:" + v).getPassages()
            const lxx = p.convertVersion("lxx")
            assert.equal(lxx.passages[0].chapter, 38)
            assert.equal(lxx.passages[0].verse, 27)
        }
    })
})

