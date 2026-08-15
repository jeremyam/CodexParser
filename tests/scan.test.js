/**
 * Scanner and text-rewrite coverage: raw scan() matches, tolerant reference
 * forms found in real prose (dot separators, missing spaces, dotted
 * abbreviations), chapter-only references, and replace() in both modes.
 */
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { CodexParser } = require("../index.js")

const first = (ref) => new CodexParser().parse(ref).first()
const all = (ref) => new CodexParser().parse(ref).getPassages()

// ---------------------------------------------------------------------------
// scan() raw matches
// ---------------------------------------------------------------------------
test("scan() records raw matches in found with exact indices", () => {
    const parser = new CodexParser()
    const text = "Compare John 3:16 with Rom 8:28."
    parser.scan(text)
    assert.equal(parser.found.length, 2)
    assert.deepEqual(parser.found[0], {
        book: "John",
        reference: "3:16",
        startIndex: 8,
        endIndex: 17,
        version: null,
        type: "chapter_verse",
        originalText: "John 3:16",
    })
    assert.equal(parser.found[1].book, "Romans")
    assert.equal(text.slice(parser.found[1].startIndex, parser.found[1].endIndex), "Rom 8:28")
})

// ---------------------------------------------------------------------------
// Tolerant reference forms
// ---------------------------------------------------------------------------
test("dot chapter/verse separators parse: Isaiah 61.2-3", () => {
    const p = first("Isaiah 61.2-3")
    assert.equal(p.scripture.hash, "Isa.61.2-Isa.61.3")
})

test("no space between book and reference: exod15.18, Re13.8", () => {
    assert.equal(first("exod15.18").scripture.hash, "Exod.15.18")
    assert.equal(first("Re13.8").scripture.hash, "Rev.13.8")
})

test("dot separator with comma-separated ranges: Ge 27.27-29,39-41", () => {
    const p = first("Ge 27.27-29,39-41")
    assert.deepEqual(p.verses, ["27-29", "39-41"])
    assert.equal(p.scripture.hash, "Gen.27.27-Gen.27.29,Gen.27.39-Gen.27.41")
})

test("dotted abbreviation Jd. resolves to Jude", () => {
    assert.equal(first("Jd. 5").scripture.hash, "Jude.1.5")
})

test("Ezra and Ezekiel abbreviations stay distinct in one text", () => {
    const passages = all("Ezra 1:20 Ezk 23:22")
    assert.deepEqual(
        Array.from(passages, (p) => p.book),
        ["Ezra", "Ezekiel"]
    )
    // Ezra 1 has only 11 verses, so 1:20 is parsed but flagged out of range.
    assert.equal(passages[0].valid.code, 104)
    assert.equal(passages[1].valid, true)
    assert.equal(passages[1].scripture.hash, "Ezek.23.22")
})

test("spaced dash still forms one multi-chapter range: Genesis 2:1 - 3:19", () => {
    const p = first("Genesis 2:1 - 3:19")
    assert.equal(p.type, "multi_chapter_verse_range")
    assert.equal(p.scripture.hash, "Gen.2.1-Gen.3.19")
})

test("comma list with spaces keeps the chapter context: Genesis 1:3, 9, 11, 15, 24, 29-30", () => {
    const p = first("Genesis 1:3, 9, 11, 15, 24, 29-30")
    assert.equal(p.chapter, 1)
    assert.deepEqual(
        p.verses.map(String),
        ["3", "9", "11", "15", "24", "29-30"]
    )
    assert.equal(p.scripture.hash, "Gen.1.3,Gen.1.9,Gen.1.11,Gen.1.15,Gen.1.24,Gen.1.29-Gen.1.30")
})

// ---------------------------------------------------------------------------
// Chapter-only references
// ---------------------------------------------------------------------------
test("bare chapter expands to the whole chapter: Jonah 3", () => {
    const p = first("Jonah 3")
    assert.equal(p.type, "single_chapter")
    assert.deepEqual(p.verses, ["1-10"])
    assert.equal(p.scripture.hash, "Jonah.3.1-Jonah.3.10")
})

test("chapter range expands across chapters: Psalm 113-118", () => {
    const p = first("Psalm 113-118")
    assert.equal(p.type, "chapter_range")
    assert.equal(p.scripture.hash, "Ps.113.1-Ps.118.29")
})

// ---------------------------------------------------------------------------
// replace()
// ---------------------------------------------------------------------------
test("replace() rewrites to abbreviations or full names in place", () => {
    const text = "But he turned —Mat 16:23 a. Lk. 1:1 end"

    const abbrParser = new CodexParser()
    abbrParser.parse(text)
    assert.equal(abbrParser.replace(text, true), "But he turned —Matt. 16:23 a. Luke 1:1 end")

    const fullParser = new CodexParser()
    fullParser.parse(text)
    assert.equal(fullParser.replace(text, false), "But he turned —Matthew 16:23 a. Luke 1:1 end")
})

test("replace() expands a chapter-switching comma list into '; '-joined refs", () => {
    const parser = new CodexParser()
    const text = "Read Daniel 8:16-18,9:21,23 today"
    parser.parse(text)
    assert.equal(parser.replace(text), "Read Dan. 8:16-18; Dan. 9:21,23 today")
})

test("replace() leaves non-reference text and already-abbreviated refs intact", () => {
    const parser = new CodexParser()
    const text = "See Genesis 1:1 and John 3:16."
    parser.parse(text)
    assert.equal(parser.replace(text), "See Gen. 1:1 and John 3:16.")
})
