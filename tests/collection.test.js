/**
 * Collection-helper coverage: PassageCollection filters, combine() at both
 * the parser and collection level, and the package export shapes.
 */
const { test } = require("node:test")
const assert = require("node:assert/strict")
const { CodexParser } = require("../index.js")

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------
test("index.js exports the class as module.exports, .CodexParser, and .default", () => {
    const mod = require("../index.js")
    assert.equal(typeof mod, "function")
    assert.equal(mod.CodexParser, mod)
    assert.equal(mod.default, mod)
    assert.ok(new mod() instanceof mod)
})

// ---------------------------------------------------------------------------
// Testament filters
// ---------------------------------------------------------------------------
test("oldTestament()/newTestament() split a mixed collection", () => {
    const passages = new CodexParser().parse("Genesis 1:1; John 3:16; Malachi 4:5").getPassages()
    assert.deepEqual(
        Array.from(passages.oldTestament(), (p) => p.book),
        ["Genesis", "Malachi"]
    )
    assert.deepEqual(
        Array.from(passages.newTestament(), (p) => p.book),
        ["John"]
    )
})

test("collection first() returns the first passage, and is a PassageCollection array", () => {
    const passages = new CodexParser().parse("Genesis 1:1; John 3:16").getPassages()
    assert.ok(Array.isArray(passages))
    assert.equal(passages.constructor.name, "PassageCollection")
    assert.equal(passages.first().book, "Genesis")
})

// ---------------------------------------------------------------------------
// parser.combine()
// ---------------------------------------------------------------------------
test("combine() joins same-book passages across chapters into one range", () => {
    const parser = new CodexParser()
    parser.parse("Rev 1:8, Rev 2:17")
    const combined = parser.combine()
    assert.equal(combined.type, "multi_chapter_verse_range")
    assert.equal(combined.original, "Revelation 1:8; 2:17")
    assert.equal(combined.scripture.hash, "Rev.1.8-Rev.2.17")
    assert.deepEqual(combined.passages, [
        { book: "Revelation", chapter: 1, verse: 8 },
        { book: "Revelation", chapter: 2, verse: 17 },
    ])
})

test("combine() merges adjacent verse runs within a chapter", () => {
    const parser = new CodexParser()
    parser.parse("John 1:1; John 1:2-3; John 1:5")
    const combined = parser.combine()
    assert.equal(combined.original, "John 1:1-3,5")
    assert.deepEqual(combined.verses, ["1-3", "5"])
    assert.equal(combined.scripture.hash, "John.1.1-John.1.3,John.1.5")
})

test("combine() of a single passage keeps its reference", () => {
    const parser = new CodexParser()
    const single = parser.parse("Daniel 7:1-5").getPassages().first()
    const combined = parser.combine([single])
    assert.equal(combined.original, "Daniel 7:1-5")
    assert.deepEqual(combined.verses, ["1-5"])
    assert.equal(combined.scripture.hash, "Dan.7.1-Dan.7.5")
})

test("combine() throws when passages span different books", () => {
    const parser = new CodexParser()
    parser.parse("John 1:1; Genesis 1:1")
    assert.throws(() => parser.combine(), /same book/)
})

// ---------------------------------------------------------------------------
// collection.combine(options)
// ---------------------------------------------------------------------------
test("collection combine({book, chapter}) groups per book and chapter", () => {
    const parser = new CodexParser()
    parser.parse("Matthew 12:16, Matthew 12:19, Matthew 13:1")
    const combined = parser.getPassages().combine({ book: true, chapter: true })
    assert.equal(combined.length, 2)
    assert.equal(combined[0].original, "Matthew 12:16,19")
    assert.equal(combined[0].scripture.hash, "Matt.12.16,Matt.12.19")
    assert.equal(combined[1].original, "Matthew 13:1")
    assert.equal(combined[1].scripture.hash, "Matt.13.1")
})

test("collection combine({book: true, chapter: false}) groups whole books", () => {
    const parser = new CodexParser()
    parser.parse("Genesis 1:1-3, Genesis 1:4-5, Genesis 2:5, Matthew 1:1-5, Matthew 12:16, Matthew 12:19")
    const combined = parser.getPassages().combine({ book: true, chapter: false })
    assert.equal(combined.length, 2)
    assert.equal(combined[0].original, "Genesis 1:1-5; 2:5")
    assert.equal(combined[0].scripture.hash, "Gen.1.1-Gen.2.5")
    assert.equal(combined[1].original, "Matthew 1:1-5; 12:16,19")
    assert.deepEqual(combined[1].end, { book: "Matthew", chapter: 12, verse: 19 })
})
