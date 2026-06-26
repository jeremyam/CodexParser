/**
 * Comprehensive scripture-parsing coverage for CodexParser.
 * Runs on Node's built-in test runner (no dependencies): `npm test` / `node --test tests/`.
 *
 * Each block targets a parsing dimension — single refs, ranges, comma lists,
 * chapter-switching lists, dashes, scan offsets, abbreviations, single-chapter
 * books, validation, versification, and the collection helpers.
 */
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { CodexParser } = require("../index.js")

/** Parse a reference and return the first passage object. */
const first = (ref) => new CodexParser().parse(ref).first()
/** Parse a reference and return the full PassageCollection. */
const all = (ref) => new CodexParser().parse(ref).getPassages()

// ---------------------------------------------------------------------------
// Single verse
// ---------------------------------------------------------------------------
test("single verse: John 3:16", () => {
    const p = first("John 3:16")
    assert.equal(p.book, "John")
    assert.equal(p.chapter, 3)
    assert.deepEqual(p.verses, ["16"])
    assert.equal(p.type, "chapter_verse")
    assert.equal(p.testament, "new")
    assert.equal(p.valid, true)
    assert.equal(p.scripture.hash, "John.3.16")
    assert.equal(p.scripture.osisNumeric, "43003016")
    assert.deepEqual(p.passages, [{ book: "John", chapter: 3, verse: 16 }])
    assert.deepEqual(p.start, { book: "John", chapter: 3, verse: 16 })
    assert.deepEqual(p.end, { book: "John", chapter: 3, verse: 16 })
})

// ---------------------------------------------------------------------------
// Verse ranges
// ---------------------------------------------------------------------------
test("verse range: Romans 3:22-24 expands every verse", () => {
    const p = first("Romans 3:22-24")
    assert.equal(p.type, "chapter_verse_range")
    assert.deepEqual(p.verses, ["22-24"])
    assert.deepEqual(
        p.passages.map((v) => v.verse),
        [22, 23, 24]
    )
    assert.equal(p.scripture.hash, "Rom.3.22-Rom.3.24")
    assert.equal(p.scripture.osisNumeric, "45003022-45003024")
    assert.deepEqual(p.start, { book: "Romans", chapter: 3, verse: 22 })
    assert.deepEqual(p.end, { book: "Romans", chapter: 3, verse: 24 })
})

test("chapter range: Genesis 1-2 spans whole chapters", () => {
    const p = first("Genesis 1-2")
    assert.equal(p.scripture.hash, "Gen.1.1-Gen.2.25")
    assert.equal(p.start.verse, 1)
    assert.equal(p.end.chapter, 2)
})

test("multi-chapter verse range: Matthew 5:1-7:29", () => {
    const p = first("Matthew 5:1-7:29")
    assert.equal(p.scripture.hash, "Matt.5.1-Matt.7.29")
    assert.deepEqual(p.start, { book: "Matthew", chapter: 5, verse: 1 })
    assert.deepEqual(p.end, { book: "Matthew", chapter: 7, verse: 29 })
})

// ---------------------------------------------------------------------------
// Comma lists
// ---------------------------------------------------------------------------
test("comma list, same chapter: Daniel 9:21,23", () => {
    const p = first("Daniel 9:21,23")
    assert.equal(p.type, "comma_separated_verses")
    assert.deepEqual(
        p.passages.map((v) => v.verse),
        [21, 23]
    )
    assert.equal(p.scripture.hash, "Dan.9.21,Dan.9.23")
})

test("bare-verse comma list: Genesis 1:1,2,3", () => {
    const p = first("Genesis 1:1,2,3")
    assert.equal(p.chapter, 1)
    assert.deepEqual(
        p.passages.map((v) => v.verse),
        [1, 2, 3]
    )
})

// ---------------------------------------------------------------------------
// Chapter-switching comma list — the 0.5.4 regression
// ---------------------------------------------------------------------------
test("chapter-switching comma list splits one passage per chapter (0.5.4)", () => {
    const passages = all("Daniel 8:16-18,9:21,23,10:8-10")
    assert.equal(passages.length, 3)

    assert.equal(passages[0].chapter, 8)
    assert.equal(passages[0].type, "chapter_verse_range")
    assert.equal(passages[0].scripture.hash, "Dan.8.16-Dan.8.18")

    assert.equal(passages[1].chapter, 9)
    assert.equal(passages[1].type, "comma_separated_verses")
    assert.deepEqual(
        passages[1].passages.map((v) => v.verse),
        [21, 23]
    )

    assert.equal(passages[2].chapter, 10)
    assert.equal(passages[2].type, "chapter_verse_range")
    assert.equal(passages[2].scripture.hash, "Dan.10.8-Dan.10.10")
})

test("chapter-switching with bare verses across two chapters", () => {
    const passages = all("Genesis 1:1,5,2:3")
    assert.equal(passages.length, 2)
    assert.equal(passages[0].chapter, 1)
    assert.deepEqual(
        passages[0].passages.map((v) => v.verse),
        [1, 5]
    )
    assert.equal(passages[1].chapter, 2)
    assert.deepEqual(
        passages[1].passages.map((v) => v.verse),
        [3]
    )
})

// ---------------------------------------------------------------------------
// Dash normalization — the 0.5.3 added behavior
// ---------------------------------------------------------------------------
test("en-dash range parses as a range, preserving the source dash (0.5.3)", () => {
    const p = first("Lamentations 3:22–24") // 3:22–24
    assert.equal(p.scripture.hash, "Lam.3.22-Lam.3.24")
    assert.ok(p.originalText.includes("–"), "originalText keeps the en-dash")
})

test("em-dash range parses as a range", () => {
    const p = first("Lamentations 3:22—24") // 3:22—24
    assert.equal(p.scripture.hash, "Lam.3.22-Lam.3.24")
})

// ---------------------------------------------------------------------------
// Scan offsets — the 0.5.3 fix
// ---------------------------------------------------------------------------
test("scan offsets survive punctuation and parens (0.5.3)", () => {
    const text = "See John 3:16 (cf. Lamentations 3:1) today."
    const passages = all(text)
    assert.equal(passages.length, 2)
    for (const p of passages) {
        // The headline 0.5.3 invariant: indices align exactly with the source.
        assert.equal(text.slice(p.startIndex, p.endIndex), p.originalText)
    }
    assert.equal(passages[0].originalText, "John 3:16")
    assert.equal(passages[1].originalText, "Lamentations 3:1")
})

test("scan slice integrity holds across mixed reference forms", () => {
    const samples = [
        "Read 1 Cor. 13:4-7, then Ps. 23, and finally Rev. 21:1–4.",
        "Compare Isa 1:1; 2:2 with Mic 5:2.",
        "Daniel 8:16-18,9:21,23,10:8-10 is a chain.",
    ]
    for (const text of samples) {
        for (const p of all(text)) {
            assert.equal(
                text.slice(p.startIndex, p.endIndex),
                p.originalText,
                `slice mismatch in: ${text}`
            )
        }
    }
})

// ---------------------------------------------------------------------------
// Semicolon lists — book/chapter inheritance
// ---------------------------------------------------------------------------
test("semicolon list inherits book (and chapter) from the prior reference", () => {
    const passages = all("Isa 1:1; 2:2")
    assert.equal(passages.length, 2)
    assert.equal(passages[0].book, "Isaiah")
    assert.equal(passages[0].chapter, 1)
    assert.equal(passages[1].book, "Isaiah")
    assert.equal(passages[1].chapter, 2)
    assert.equal(passages[1].scripture.hash, "Isa.2.2")
})

// ---------------------------------------------------------------------------
// Abbreviations and numbered books
// ---------------------------------------------------------------------------
test("abbreviation expands to full book name; abbr round-trips", () => {
    const p = first("1 Cor. 13:4-7")
    assert.equal(p.original, "1 Corinthians 13:4-7")
    assert.equal(p.book, "1 Corinthians")
    assert.equal(p.abbr, "1 Cor. 13:4-7")
    assert.equal(p.scripture.hash, "1Cor.13.4-1Cor.13.7")
})

test("numbered books resolve: 1 Kings, 2 Samuel", () => {
    assert.equal(first("1 Kings 8:27").book, "1 Kings")
    assert.equal(first("2 Samuel 7:12").book, "2 Samuel")
})

// ---------------------------------------------------------------------------
// Single-chapter books
// ---------------------------------------------------------------------------
test("single-chapter book with explicit chapter:verse is valid (Jude 1:4)", () => {
    const p = first("Jude 1:4")
    assert.equal(p.book, "Jude")
    assert.equal(p.chapter, 1)
    assert.deepEqual(p.verses, ["4"])
    assert.equal(p.valid, true)
    assert.equal(p.scripture.hash, "Jude.1.4")
})

test("single-chapter book bare number is a verse, not a chapter (Jude 4 = Jude 1:4)", () => {
    const p = first("Jude 4")
    assert.equal(p.book, "Jude")
    assert.equal(p.chapter, 1)
    assert.equal(p.valid, true)
    assert.equal(p.type, "chapter_verse")
    assert.equal(p.scripture.hash, "Jude.1.4")
    assert.deepEqual(p.passages, [{ book: "Jude", chapter: 1, verse: 4 }])
})

test("bare-number verses resolve across all single-chapter books", () => {
    const cases = [
        ["Philemon 6", "Phlm.1.6"],
        ["Obadiah 15", "Obad.1.15"],
        ["2 John 7", "2John.1.7"],
        ["3 John 4", "3John.1.4"],
    ]
    for (const [ref, hash] of cases) {
        const p = first(ref)
        assert.equal(p.chapter, 1, `${ref} should be chapter 1`)
        assert.equal(p.valid, true, `${ref} should be valid`)
        assert.equal(p.scripture.hash, hash)
    }
})

test("single-chapter book: bare '1' is the whole book; ranges and lists still parse", () => {
    assert.equal(first("Jude 1").scripture.hash, "Jude.1.1-Jude.1.25") // whole book, unchanged
    assert.equal(first("Jude 4-7").scripture.hash, "Jude.1.4-Jude.1.7")
    assert.equal(first("Obadiah 1-4").scripture.hash, "Obad.1.1-Obad.1.4")
})

test("single-chapter book: out-of-range bare verse is flagged invalid", () => {
    const p = first("Obadiah 22") // Obadiah has 21 verses
    assert.equal(p.chapter, 1)
    assert.equal(p.valid.error, true)
    assert.equal(p.valid.code, 104)
})

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
test("out-of-range verse is flagged invalid but still parsed", () => {
    const p = first("Genesis 1:99")
    assert.equal(p.chapter, 1)
    assert.deepEqual(p.verses, ["99"])
    assert.equal(p.valid.error, true)
    assert.equal(p.valid.code, 104)
})

test("unknown book yields no passages", () => {
    assert.equal(first("Hezekiah 3:4"), null)
    assert.equal(all("Hezekiah 3:4").length, 0)
})

// ---------------------------------------------------------------------------
// Multiple references in prose
// ---------------------------------------------------------------------------
test("multiple distinct references in prose are each captured", () => {
    const passages = all("Genesis 1:1 and John 3:16 and Romans 8:28")
    assert.equal(passages.length, 3)
    assert.deepEqual(
        Array.from(passages, (p) => p.book),
        ["Genesis", "John", "Romans"]
    )
})

// ---------------------------------------------------------------------------
// Versification
// ---------------------------------------------------------------------------
test("parsing as LXX records the cross-version mapping", () => {
    const p = new CodexParser().bibleVersion("lxx").parse("Genesis 32:1").first()
    assert.equal(p.version.value, "LXX")
    assert.deepEqual(p.passages[0].versification, {
        lxx: "32:1",
        mt: "32:1",
        eng: "31:55",
    })
})

test("convertVersion remaps ENG → LXX (Genesis 31:55 → 32:1)", () => {
    const eng = first("Genesis 31:55")
    assert.equal(typeof eng.convertVersion, "function")
    const lxx = eng.convertVersion("lxx")
    assert.equal(lxx.chapter, 32)
    assert.deepEqual(lxx.verses, ["1"])
    assert.equal(lxx.version.value, "LXX")
})

test("Zechariah 2:10 uses Göttingen LXX numbering, distinct from MT (0.5.1)", () => {
    const v = first("Zechariah 2:10").passages[0].versification
    assert.equal(v.eng, "2:10")
    assert.equal(v.lxx, "2:10") // Göttingen = English here...
    assert.equal(v.mt, "2:14") // ...while MT/Rahlfs differs
})

// ---------------------------------------------------------------------------
// Collection helpers
// ---------------------------------------------------------------------------
test("same() reports whether all passages share a book", () => {
    assert.equal(new CodexParser().parse("Romans 8:1; Romans 8:28").same(), true)
    assert.equal(new CodexParser().parse("Romans 8:1; John 1:1").same(), false)
})

test("replace() swaps references for abbreviated form", () => {
    const parser = new CodexParser()
    const text = "See Genesis 1:1 now."
    parser.parse(text)
    const out = parser.replace(text)
    assert.ok(out.includes("Gen. 1:1"), `expected abbreviated ref in: ${out}`)
    assert.ok(!out.includes("Genesis 1:1"), "full name should be replaced")
})
